/**
 * Standard Genetic Algorithm for Multibeam Optimization
 * Bài toán: Tối ưu hóa beamforming vector cho hệ thống JCAS
 */

class GeneticAlgorithm {
    constructor(params) {
        // Tham số hệ thống
        this.M = params.M || 16;  // Số phần tử antenna
        this.populationSize = params.populationSize || 100;
        this.maxGenerations = params.maxGenerations || 200;
        this.crossoverRate = params.crossoverRate || 0.8;
        this.mutationRate = params.mutationRate || 0.1;
        this.elitismRate = params.elitismRate || 0.1;
        
        // Tham số bài toán
        this.thetaComm = params.thetaComm || 0;  // Communication direction (degrees)
        this.thetaSense = params.thetaSense || [30, 45, 60];  // Sensing directions
        this.Gmin = params.Gmin || 0.5;  // Minimum sensing gain
        this.SLmax = params.SLmax || 0.1;  // Maximum sidelobe level
        
        // Hệ số fitness
        this.alpha1 = params.alpha1 || 1.0;
        this.alpha2 = params.alpha2 || 0.5;
        this.alpha3 = params.alpha3 || 0.3;
        
        // Lưu lịch sử
        this.history = {
            bestFitness: [],
            avgFitness: [],
            bestIndividual: null
        };
    }
    
    /**
     * Array response vector cho ULA
     */
    arrayResponse(theta) {
        const thetaRad = theta * Math.PI / 180;
        const response = [];
        for (let m = 0; m < this.M; m++) {
            const phase = Math.PI * m * Math.sin(thetaRad);
            response.push({
                real: Math.cos(phase),
                imag: Math.sin(phase)
            });
        }
        return response;
    }
    
    /**
     * Tính beamforming gain theo hướng theta
     */
    beamformingGain(w, theta) {
        const a = this.arrayResponse(theta);
        let sumReal = 0, sumImag = 0;
        
        for (let m = 0; m < this.M; m++) {
            // w[m] * conj(a[m])
            const real = w[m].magnitude * Math.cos(w[m].phase) * a[m].real + 
                        w[m].magnitude * Math.sin(w[m].phase) * a[m].imag;
            const imag = w[m].magnitude * Math.sin(w[m].phase) * a[m].real - 
                        w[m].magnitude * Math.cos(w[m].phase) * a[m].imag;
            sumReal += real;
            sumImag += imag;
        }
        
        return sumReal * sumReal + sumImag * sumImag;
    }
    
    /**
     * Tính radiation pattern (toàn bộ vòng tròn)
     */
    radiationPattern(w) {
        const pattern = [];
        for (let theta = -90; theta <= 90; theta += 1) {
            pattern.push({
                angle: theta,
                gain: this.beamformingGain(w, theta)
            });
        }
        return pattern;
    }
    
    /**
     * Khởi tạo một cá thể ngẫu nhiên
     */
    randomIndividual() {
        const w = [];
        let sumMag = 0;
        
        // Random magnitude và phase
        for (let m = 0; m < this.M; m++) {
            const mag = Math.random();
            sumMag += mag * mag;
            w.push({
                magnitude: mag,
                phase: Math.random() * 2 * Math.PI
            });
        }
        
        // Normalize để ||w||² = 1
        const norm = Math.sqrt(sumMag);
        for (let m = 0; m < this.M; m++) {
            w[m].magnitude /= norm;
        }
        
        return w;
    }
    
    /**
     * Khởi tạo quần thể
     */
    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push(this.randomIndividual());
        }
        return population;
    }
    
    /**
     * Đánh giá fitness
     */
    evaluateFitness(individual) {
        // 1. Communication SNR (maximize)
        const commGain = this.beamformingGain(individual, this.thetaComm);
        
        // 2. Sensing constraint penalty
        let sensingPenalty = 0;
        for (const theta of this.thetaSense) {
            const senseGain = this.beamformingGain(individual, theta);
            if (senseGain < this.Gmin) {
                sensingPenalty += (this.Gmin - senseGain) ** 2;
            }
        }
        
        // 3. Sidelobe penalty
        let sidelobePenalty = 0;
        const excludeRange = 10;  // degrees around main beams
        
        for (let theta = -90; theta <= 90; theta += 2) {
            // Skip main beam areas
            let isMainBeam = Math.abs(theta - this.thetaComm) < excludeRange;
            for (const thetaS of this.thetaSense) {
                if (Math.abs(theta - thetaS) < excludeRange) {
                    isMainBeam = true;
                    break;
                }
            }
            
            if (!isMainBeam) {
                const gain = this.beamformingGain(individual, theta);
                if (gain > this.SLmax) {
                    sidelobePenalty += (gain - this.SLmax) ** 2;
                }
            }
        }
        
        // Tổng fitness
        const fitness = this.alpha1 * commGain - 
                       this.alpha2 * sensingPenalty - 
                       this.alpha3 * sidelobePenalty;
        
        return {
            fitness: fitness,
            commGain: commGain,
            sensingPenalty: sensingPenalty,
            sidelobePenalty: sidelobePenalty
        };
    }
    
    /**
     * Tournament selection
     */
    tournamentSelection(population, fitnessValues, tournamentSize = 3) {
        let best = null;
        let bestFitness = -Infinity;
        
        for (let i = 0; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * population.length);
            if (fitnessValues[idx].fitness > bestFitness) {
                bestFitness = fitnessValues[idx].fitness;
                best = population[idx];
            }
        }
        
        return JSON.parse(JSON.stringify(best));  // Deep copy
    }
    
    /**
     * Uniform crossover
     */
    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) {
            return [
                JSON.parse(JSON.stringify(parent1)),
                JSON.parse(JSON.stringify(parent2))
            ];
        }
        
        const child1 = [];
        const child2 = [];
        
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < 0.5) {
                child1.push(JSON.parse(JSON.stringify(parent1[m])));
                child2.push(JSON.parse(JSON.stringify(parent2[m])));
            } else {
                child1.push(JSON.parse(JSON.stringify(parent2[m])));
                child2.push(JSON.parse(JSON.stringify(parent1[m])));
            }
        }
        
        // Normalize
        this.normalizeIndividual(child1);
        this.normalizeIndividual(child2);
        
        return [child1, child2];
    }
    
    /**
     * Gaussian mutation
     */
    mutate(individual) {
        const mutated = JSON.parse(JSON.stringify(individual));
        
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < this.mutationRate) {
                // Mutate magnitude
                const deltaMag = (Math.random() - 0.5) * 0.2;
                mutated[m].magnitude += deltaMag;
                mutated[m].magnitude = Math.max(0.01, mutated[m].magnitude);
            }
            
            if (Math.random() < this.mutationRate) {
                // Mutate phase
                const deltaPhase = (Math.random() - 0.5) * Math.PI / 4;
                mutated[m].phase += deltaPhase;
                mutated[m].phase = (mutated[m].phase + 2 * Math.PI) % (2 * Math.PI);
            }
        }
        
        this.normalizeIndividual(mutated);
        return mutated;
    }
    
    /**
     * Normalize individual để ||w||² = 1
     */
    normalizeIndividual(individual) {
        let sumMag = 0;
        for (let m = 0; m < this.M; m++) {
            sumMag += individual[m].magnitude ** 2;
        }
        const norm = Math.sqrt(sumMag);
        for (let m = 0; m < this.M; m++) {
            individual[m].magnitude /= norm;
        }
    }
    
    /**
     * Main GA loop
     */
    run() {
        console.log("=== Standard Genetic Algorithm ===");
        console.log(`Population Size: ${this.populationSize}`);
        console.log(`Max Generations: ${this.maxGenerations}`);
        console.log(`Crossover Rate: ${this.crossoverRate}`);
        console.log(`Mutation Rate: ${this.mutationRate}`);
        console.log("");
        
        // Khởi tạo
        let population = this.initializePopulation();
        const eliteCount = Math.floor(this.populationSize * this.elitismRate);
        
        for (let gen = 0; gen < this.maxGenerations; gen++) {
            // Đánh giá fitness
            const fitnessValues = population.map(ind => this.evaluateFitness(ind));
            
            // Sắp xếp theo fitness
            const sortedIndices = fitnessValues
                .map((f, idx) => ({ fitness: f.fitness, idx: idx }))
                .sort((a, b) => b.fitness - a.fitness)
                .map(item => item.idx);
            
            const bestFitness = fitnessValues[sortedIndices[0]].fitness;
            const avgFitness = fitnessValues.reduce((sum, f) => sum + f.fitness, 0) / 
                             this.populationSize;
            
            // Lưu lịch sử
            this.history.bestFitness.push(bestFitness);
            this.history.avgFitness.push(avgFitness);
            
            if (gen % 20 === 0) {
                const best = fitnessValues[sortedIndices[0]];
                console.log(`Gen ${gen}: Best Fitness = ${bestFitness.toFixed(4)}, ` +
                          `Avg = ${avgFitness.toFixed(4)}`);
                console.log(`  Comm Gain: ${best.commGain.toFixed(4)}, ` +
                          `Sense Penalty: ${best.sensingPenalty.toFixed(4)}, ` +
                          `Sidelobe Penalty: ${best.sidelobePenalty.toFixed(4)}`);
            }
            
            // Tạo thế hệ mới
            const newPopulation = [];
            
            // Elitism: giữ lại các cá thể tốt nhất
            for (let i = 0; i < eliteCount; i++) {
                newPopulation.push(
                    JSON.parse(JSON.stringify(population[sortedIndices[i]]))
                );
            }
            
            // Tạo offspring
            while (newPopulation.length < this.populationSize) {
                const parent1 = this.tournamentSelection(population, fitnessValues);
                const parent2 = this.tournamentSelection(population, fitnessValues);
                
                const [child1, child2] = this.crossover(parent1, parent2);
                
                newPopulation.push(this.mutate(child1));
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(this.mutate(child2));
                }
            }
            
            population = newPopulation;
        }
        
        // Kết quả cuối cùng
        const finalFitness = population.map(ind => this.evaluateFitness(ind));
        const bestIdx = finalFitness
            .map((f, idx) => ({ fitness: f.fitness, idx: idx }))
            .sort((a, b) => b.fitness - a.fitness)[0].idx;
        
        this.history.bestIndividual = population[bestIdx];
        
        console.log("\n=== Kết quả cuối cùng ===");
        const finalBest = finalFitness[bestIdx];
        console.log(`Best Fitness: ${finalBest.fitness.toFixed(4)}`);
        console.log(`Communication Gain: ${finalBest.commGain.toFixed(4)}`);
        console.log(`Sensing Penalty: ${finalBest.sensingPenalty.toFixed(4)}`);
        console.log(`Sidelobe Penalty: ${finalBest.sidelobePenalty.toFixed(4)}`);
        
        return {
            bestIndividual: this.history.bestIndividual,
            bestFitness: finalBest,
            history: this.history
        };
    }
}

// Export cho Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneticAlgorithm;
}
