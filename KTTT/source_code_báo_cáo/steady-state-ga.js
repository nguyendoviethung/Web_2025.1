/**
 * Steady State Genetic Algorithm for Multibeam Optimization
 * Khác với Standard GA: chỉ thay thế 1-2 cá thể mỗi generation
 */

class SteadyStateGA {
    constructor(params) {
        // Tham số hệ thống
        this.M = params.M || 16;
        this.populationSize = params.populationSize || 100;
        this.maxGenerations = params.maxGenerations || 200;
        this.crossoverRate = params.crossoverRate || 0.8;
        this.mutationRate = params.mutationRate || 0.1;
        this.replacementCount = params.replacementCount || 2;  // Số cá thể thay thế
        
        // Tham số bài toán
        this.thetaComm = params.thetaComm || 0;
        this.thetaSense = params.thetaSense || [30, 45, 60];
        this.Gmin = params.Gmin || 0.5;
        this.SLmax = params.SLmax || 0.1;
        
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
     * Array response vector
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
     * Beamforming gain
     */
    beamformingGain(w, theta) {
        const a = this.arrayResponse(theta);
        let sumReal = 0, sumImag = 0;
        
        for (let m = 0; m < this.M; m++) {
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
     * Radiation pattern
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
     * Random individual
     */
    randomIndividual() {
        const w = [];
        let sumMag = 0;
        
        for (let m = 0; m < this.M; m++) {
            const mag = Math.random();
            sumMag += mag * mag;
            w.push({
                magnitude: mag,
                phase: Math.random() * 2 * Math.PI
            });
        }
        
        const norm = Math.sqrt(sumMag);
        for (let m = 0; m < this.M; m++) {
            w[m].magnitude /= norm;
        }
        
        return w;
    }
    
    /**
     * Initialize population
     */
    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push(this.randomIndividual());
        }
        return population;
    }
    
    /**
     * Evaluate fitness
     */
    evaluateFitness(individual) {
        const commGain = this.beamformingGain(individual, this.thetaComm);
        
        let sensingPenalty = 0;
        for (const theta of this.thetaSense) {
            const senseGain = this.beamformingGain(individual, theta);
            if (senseGain < this.Gmin) {
                sensingPenalty += (this.Gmin - senseGain) ** 2;
            }
        }
        
        let sidelobePenalty = 0;
        const excludeRange = 10;
        
        for (let theta = -90; theta <= 90; theta += 2) {
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
     * Binary tournament selection
     */
    binaryTournamentSelection(population, fitnessValues) {
        const idx1 = Math.floor(Math.random() * population.length);
        const idx2 = Math.floor(Math.random() * population.length);
        
        if (fitnessValues[idx1].fitness > fitnessValues[idx2].fitness) {
            return JSON.parse(JSON.stringify(population[idx1]));
        } else {
            return JSON.parse(JSON.stringify(population[idx2]));
        }
    }
    
    /**
     * Blend crossover (BLX-α)
     */
    blendCrossover(parent1, parent2, alpha = 0.5) {
        if (Math.random() > this.crossoverRate) {
            return [
                JSON.parse(JSON.stringify(parent1)),
                JSON.parse(JSON.stringify(parent2))
            ];
        }
        
        const child1 = [];
        const child2 = [];
        
        for (let m = 0; m < this.M; m++) {
            // Blend magnitude
            const mag1 = parent1[m].magnitude;
            const mag2 = parent2[m].magnitude;
            const magMin = Math.min(mag1, mag2);
            const magMax = Math.max(mag1, mag2);
            const magRange = magMax - magMin;
            
            const newMag1 = magMin - alpha * magRange + 
                           Math.random() * (magRange * (1 + 2 * alpha));
            const newMag2 = magMin - alpha * magRange + 
                           Math.random() * (magRange * (1 + 2 * alpha));
            
            // Blend phase
            const phase1 = parent1[m].phase;
            const phase2 = parent2[m].phase;
            const phaseMin = Math.min(phase1, phase2);
            const phaseMax = Math.max(phase1, phase2);
            const phaseRange = phaseMax - phaseMin;
            
            const newPhase1 = phaseMin - alpha * phaseRange + 
                             Math.random() * (phaseRange * (1 + 2 * alpha));
            const newPhase2 = phaseMin - alpha * phaseRange + 
                             Math.random() * (phaseRange * (1 + 2 * alpha));
            
            child1.push({
                magnitude: Math.max(0.01, newMag1),
                phase: (newPhase1 + 2 * Math.PI) % (2 * Math.PI)
            });
            
            child2.push({
                magnitude: Math.max(0.01, newMag2),
                phase: (newPhase2 + 2 * Math.PI) % (2 * Math.PI)
            });
        }
        
        this.normalizeIndividual(child1);
        this.normalizeIndividual(child2);
        
        return [child1, child2];
    }
    
    /**
     * Mutation
     */
    mutate(individual) {
        const mutated = JSON.parse(JSON.stringify(individual));
        
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < this.mutationRate) {
                const deltaMag = (Math.random() - 0.5) * 0.2;
                mutated[m].magnitude += deltaMag;
                mutated[m].magnitude = Math.max(0.01, mutated[m].magnitude);
            }
            
            if (Math.random() < this.mutationRate) {
                const deltaPhase = (Math.random() - 0.5) * Math.PI / 4;
                mutated[m].phase += deltaPhase;
                mutated[m].phase = (mutated[m].phase + 2 * Math.PI) % (2 * Math.PI);
            }
        }
        
        this.normalizeIndividual(mutated);
        return mutated;
    }
    
    /**
     * Normalize
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
     * Main Steady State GA loop
     */
    run() {
        console.log("=== Steady State Genetic Algorithm ===");
        console.log(`Population Size: ${this.populationSize}`);
        console.log(`Max Generations: ${this.maxGenerations}`);
        console.log(`Replacement Count: ${this.replacementCount}`);
        console.log(`Crossover Rate: ${this.crossoverRate}`);
        console.log(`Mutation Rate: ${this.mutationRate}`);
        console.log("");
        
        // Khởi tạo
        let population = this.initializePopulation();
        let fitnessValues = population.map(ind => this.evaluateFitness(ind));
        
        for (let gen = 0; gen < this.maxGenerations; gen++) {
            // Tìm best và worst indices
            const sortedIndices = fitnessValues
                .map((f, idx) => ({ fitness: f.fitness, idx: idx }))
                .sort((a, b) => b.fitness - a.fitness);
            
            const bestFitness = fitnessValues[sortedIndices[0].idx].fitness;
            const avgFitness = fitnessValues.reduce((sum, f) => sum + f.fitness, 0) / 
                             this.populationSize;
            
            // Lưu lịch sử
            this.history.bestFitness.push(bestFitness);
            this.history.avgFitness.push(avgFitness);
            
            if (gen % 20 === 0) {
                const best = fitnessValues[sortedIndices[0].idx];
                console.log(`Gen ${gen}: Best Fitness = ${bestFitness.toFixed(4)}, ` +
                          `Avg = ${avgFitness.toFixed(4)}`);
                console.log(`  Comm Gain: ${best.commGain.toFixed(4)}, ` +
                          `Sense Penalty: ${best.sensingPenalty.toFixed(4)}, ` +
                          `Sidelobe Penalty: ${best.sidelobePenalty.toFixed(4)}`);
            }
            
            // STEADY STATE: Chỉ tạo và thay thế một số offspring
            const offspring = [];
            const offspringFitness = [];
            
            for (let i = 0; i < this.replacementCount / 2; i++) {
                // Selection
                const parent1 = this.binaryTournamentSelection(population, fitnessValues);
                const parent2 = this.binaryTournamentSelection(population, fitnessValues);
                
                // Crossover
                const [child1, child2] = this.blendCrossover(parent1, parent2);
                
                // Mutation
                const mutated1 = this.mutate(child1);
                const mutated2 = this.mutate(child2);
                
                offspring.push(mutated1);
                offspringFitness.push(this.evaluateFitness(mutated1));
                
                if (offspring.length < this.replacementCount) {
                    offspring.push(mutated2);
                    offspringFitness.push(this.evaluateFitness(mutated2));
                }
            }
            
            // Thay thế các cá thể tệ nhất bằng offspring
            for (let i = 0; i < this.replacementCount && i < offspring.length; i++) {
                const worstIdx = sortedIndices[this.populationSize - 1 - i].idx;
                population[worstIdx] = offspring[i];
                fitnessValues[worstIdx] = offspringFitness[i];
            }
        }
        
        // Kết quả cuối cùng
        const bestIdx = fitnessValues
            .map((f, idx) => ({ fitness: f.fitness, idx: idx }))
            .sort((a, b) => b.fitness - a.fitness)[0].idx;
        
        this.history.bestIndividual = population[bestIdx];
        
        console.log("\n=== Kết quả cuối cùng ===");
        const finalBest = fitnessValues[bestIdx];
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

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SteadyStateGA;
}
