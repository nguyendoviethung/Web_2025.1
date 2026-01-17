// ============= JCAS Multibeam Optimization using Steady-State Genetic Algorithm =============

class Complex {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }
    
    add(c) {
        return new Complex(this.real + c.real, this.imag + c.imag);
    }
    
    multiply(c) {
        return new Complex(
            this.real * c.real - this.imag * c.imag,
            this.real * c.imag + this.imag * c.real
        );
    }
    
    conjugate() {
        return new Complex(this.real, -this.imag);
    }
    
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }
    
    phase() {
        return Math.atan2(this.imag, this.real);
    }
    
    static fromPolar(magnitude, phase) {
        return new Complex(
            magnitude * Math.cos(phase),
            magnitude * Math.sin(phase)
        );
    }
}

class JCASMultibeamSSGA {
    constructor(config) {
        // System parameters
        this.M = config.M || 16;  // Number of antenna elements
        this.fc = config.fc || 24e9;  // Carrier frequency (24 GHz)
        this.lambda = 3e8 / this.fc;  // Wavelength
        this.d = this.lambda / 2;  // Element spacing
        
        // Communication and sensing directions
        this.commDirection = config.commDirection || 0;  // degrees
        this.sensingDirections = config.sensingDirections || [-54.3, -37.8, -24.4, -12.3, 10.8, 22.8, 35.9, 51.9];
        
        // Power allocation
        this.rho = config.rho || 0.5;  // Communication power ratio
        
        // Steady-State GA parameters
        this.populationSize = config.populationSize || 100;
        this.maxEvaluations = config.maxEvaluations || 20000;  // Stopping criterion
        this.mutationRate = config.mutationRate || 0.1;
        this.crossoverRate = config.crossoverRate || 0.9;
        
        // SSGA specific parameters
        this.offspringSize = config.offspringSize || 2;  // Number of offspring per generation
        this.replacementStrategy = config.replacementStrategy || 'worst';  // 'worst' or 'tournament'
        this.tournamentSize = config.tournamentSize || 3;
        
        // Sampling points for array response
        this.K = config.K || 160;  // Number of sampling points
        this.angles = this.generateAngles();
        
        // Statistics
        this.evaluationCount = 0;
        this.fitnessHistory = [];
        this.diversityHistory = [];
    }
    
    generateAngles() {
        const angles = [];
        for (let i = 0; i < this.K; i++) {
            angles.push(-90 + (180 / this.K) * i);
        }
        return angles;
    }
    
    // Array response vector for ULA
    arrayResponse(theta) {
        const a = [];
        const thetaRad = theta * Math.PI / 180;
        for (let m = 0; m < this.M; m++) {
            const phase = Math.PI * m * Math.sin(thetaRad);
            a.push(Complex.fromPolar(1, phase));
        }
        return a;
    }
    
    // Generate desired array response for communication beam
    generateCommResponse() {
        const desired = [];
        const mainlobeWidth = 2 * Math.asin(1.2 / this.M) * 180 / Math.PI;
        
        for (let angle of this.angles) {
            const diff = Math.abs(angle - this.commDirection);
            if (diff <= mainlobeWidth / 2) {
                desired.push(1.0);
            } else {
                desired.push(0.0);
            }
        }
        return desired;
    }
    
    // Generate desired array response for sensing beam
    generateSensingResponse(sensingAngle) {
        const desired = [];
        const mainlobeWidth = 2 * Math.asin(1.2 / (this.M * 0.75)) * 180 / Math.PI;
        
        for (let angle of this.angles) {
            const diff = Math.abs(angle - sensingAngle);
            if (diff <= mainlobeWidth / 2) {
                desired.push(1.0);
            } else {
                desired.push(0.0);
            }
        }
        return desired;
    }
    
    // Initialize population with random beamforming vectors
    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const individual = this.createIndividual();
            population.push(individual);
        }
        return population;
    }
    
    createIndividual() {
        return {
            commWeights: this.randomWeights(),
            sensingWeights: this.randomWeights(),
            fitness: null,
            age: 0  // Age tracking for diversity
        };
    }
    
    randomWeights() {
        const weights = [];
        for (let m = 0; m < this.M; m++) {
            const magnitude = Math.random();
            const phase = Math.random() * 2 * Math.PI;
            weights.push(Complex.fromPolar(magnitude, phase));
        }
        return this.normalizeWeights(weights);
    }
    
    normalizeWeights(weights) {
        let sumPower = 0;
        for (let w of weights) {
            sumPower += w.magnitude() * w.magnitude();
        }
        const norm = Math.sqrt(sumPower);
        return weights.map(w => new Complex(w.real / norm, w.imag / norm));
    }
    
    // Fitness function: minimize MSE between desired and actual response
    fitness(individual, sensingAngle) {
        if (individual.fitness !== null) {
            return individual.fitness;
        }
        
        this.evaluationCount++;
        
        const commDesired = this.generateCommResponse();
        const sensingDesired = this.generateSensingResponse(sensingAngle);
        
        let mse = 0;
        let commGain = 0;
        let sensingGain = 0;
        
        for (let k = 0; k < this.K; k++) {
            const a = this.arrayResponse(this.angles[k]);
            
            // Communication beam response
            let commResponse = new Complex(0, 0);
            for (let m = 0; m < this.M; m++) {
                commResponse = commResponse.add(a[m].multiply(individual.commWeights[m].conjugate()));
            }
            
            // Sensing beam response
            let sensingResponse = new Complex(0, 0);
            for (let m = 0; m < this.M; m++) {
                sensingResponse = sensingResponse.add(a[m].multiply(individual.sensingWeights[m].conjugate()));
            }
            
            // Track gains at desired directions
            if (Math.abs(this.angles[k] - this.commDirection) < 1) {
                commGain = commResponse.magnitude();
            }
            if (Math.abs(this.angles[k] - sensingAngle) < 1) {
                sensingGain = sensingResponse.magnitude();
            }
            
            // Combined multibeam response
            const combined = new Complex(
                Math.sqrt(this.rho) * commResponse.real + Math.sqrt(1 - this.rho) * sensingResponse.real,
                Math.sqrt(this.rho) * commResponse.imag + Math.sqrt(1 - this.rho) * sensingResponse.imag
            );
            
            // Desired combined response
            const desired = Math.max(
                Math.sqrt(this.rho) * commDesired[k],
                Math.sqrt(1 - this.rho) * sensingDesired[k]
            );
            
            const error = combined.magnitude() - desired;
            mse += error * error;
        }
        
        // Multi-objective fitness: balance MSE and beam gains
        const fitnessValue = -mse + 10 * (commGain + sensingGain);
        individual.fitness = fitnessValue;
        
        return fitnessValue;
    }
    
    // Selection: Tournament selection
    tournamentSelection(population, fitnesses, tournamentSize = null) {
        const size = tournamentSize || this.tournamentSize;
        let best = null;
        let bestFitness = -Infinity;
        
        for (let i = 0; i < size; i++) {
            const idx = Math.floor(Math.random() * population.length);
            if (fitnesses[idx] > bestFitness) {
                bestFitness = fitnesses[idx];
                best = idx;
            }
        }
        
        return population[best];
    }
    
    // Roulette wheel selection
    rouletteSelection(population, fitnesses) {
        // Shift fitnesses to positive values
        const minFitness = Math.min(...fitnesses);
        const shiftedFitnesses = fitnesses.map(f => f - minFitness + 1);
        
        const totalFitness = shiftedFitnesses.reduce((a, b) => a + b, 0);
        const probabilities = shiftedFitnesses.map(f => f / totalFitness);
        
        let rand = Math.random();
        let sum = 0;
        
        for (let i = 0; i < population.length; i++) {
            sum += probabilities[i];
            if (rand <= sum) {
                return population[i];
            }
        }
        
        return population[population.length - 1];
    }
    
    // Crossover: Uniform crossover for better mixing
    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) {
            return [this.cloneIndividual(parent1), this.cloneIndividual(parent2)];
        }
        
        const child1 = this.createIndividual();
        const child2 = this.createIndividual();
        
        child1.commWeights = [];
        child1.sensingWeights = [];
        child2.commWeights = [];
        child2.sensingWeights = [];
        
        // Uniform crossover
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < 0.5) {
                child1.commWeights.push(new Complex(parent1.commWeights[m].real, parent1.commWeights[m].imag));
                child2.commWeights.push(new Complex(parent2.commWeights[m].real, parent2.commWeights[m].imag));
            } else {
                child1.commWeights.push(new Complex(parent2.commWeights[m].real, parent2.commWeights[m].imag));
                child2.commWeights.push(new Complex(parent1.commWeights[m].real, parent1.commWeights[m].imag));
            }
            
            if (Math.random() < 0.5) {
                child1.sensingWeights.push(new Complex(parent1.sensingWeights[m].real, parent1.sensingWeights[m].imag));
                child2.sensingWeights.push(new Complex(parent2.sensingWeights[m].real, parent2.sensingWeights[m].imag));
            } else {
                child1.sensingWeights.push(new Complex(parent2.sensingWeights[m].real, parent2.sensingWeights[m].imag));
                child2.sensingWeights.push(new Complex(parent1.sensingWeights[m].real, parent1.sensingWeights[m].imag));
            }
        }
        
        child1.commWeights = this.normalizeWeights(child1.commWeights);
        child1.sensingWeights = this.normalizeWeights(child1.sensingWeights);
        child2.commWeights = this.normalizeWeights(child2.commWeights);
        child2.sensingWeights = this.normalizeWeights(child2.sensingWeights);
        
        return [child1, child2];
    }
    
    // Mutation: Adaptive Gaussian mutation
    mutate(individual) {
        const mutated = this.cloneIndividual(individual);
        
        // Adaptive mutation rate based on population diversity
        const adaptiveMutationRate = this.mutationRate * (1 + 0.5 * Math.random());
        
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < adaptiveMutationRate) {
                // Gaussian mutation for magnitude
                const sigma = 0.1;
                const deltaMag = this.gaussianRandom(0, sigma);
                const deltaPhase = this.gaussianRandom(0, Math.PI / 6);
                
                const oldMag = mutated.commWeights[m].magnitude();
                const oldPhase = mutated.commWeights[m].phase();
                
                mutated.commWeights[m] = Complex.fromPolar(
                    Math.max(0, Math.min(2, oldMag + deltaMag)),
                    oldPhase + deltaPhase
                );
            }
            
            if (Math.random() < adaptiveMutationRate) {
                const sigma = 0.1;
                const deltaMag = this.gaussianRandom(0, sigma);
                const deltaPhase = this.gaussianRandom(0, Math.PI / 6);
                
                const oldMag = mutated.sensingWeights[m].magnitude();
                const oldPhase = mutated.sensingWeights[m].phase();
                
                mutated.sensingWeights[m] = Complex.fromPolar(
                    Math.max(0, Math.min(2, oldMag + deltaMag)),
                    oldPhase + deltaPhase
                );
            }
        }
        
        mutated.commWeights = this.normalizeWeights(mutated.commWeights);
        mutated.sensingWeights = this.normalizeWeights(mutated.sensingWeights);
        mutated.fitness = null;  // Invalidate fitness
        
        return mutated;
    }
    
    // Box-Muller transform for Gaussian random numbers
    gaussianRandom(mean = 0, stdDev = 1) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + stdDev * z0;
    }
    
    cloneIndividual(individual) {
        return {
            commWeights: individual.commWeights.map(w => new Complex(w.real, w.imag)),
            sensingWeights: individual.sensingWeights.map(w => new Complex(w.real, w.imag)),
            fitness: individual.fitness,
            age: individual.age
        };
    }
    
    // Calculate population diversity
    calculateDiversity(population) {
        let totalDistance = 0;
        let count = 0;
        
        for (let i = 0; i < population.length; i++) {
            for (let j = i + 1; j < population.length; j++) {
                let distance = 0;
                
                for (let m = 0; m < this.M; m++) {
                    const diff1 = population[i].commWeights[m].magnitude() - population[j].commWeights[m].magnitude();
                    const diff2 = population[i].sensingWeights[m].magnitude() - population[j].sensingWeights[m].magnitude();
                    distance += diff1 * diff1 + diff2 * diff2;
                }
                
                totalDistance += Math.sqrt(distance);
                count++;
            }
        }
        
        return totalDistance / count;
    }
    
    // Replacement strategies
    replaceWorst(population, fitnesses, offspring) {
        // Find worst individuals
        const sortedIndices = fitnesses
            .map((fitness, idx) => ({fitness, idx}))
            .sort((a, b) => a.fitness - b.fitness);
        
        // Replace worst with offspring
        for (let i = 0; i < offspring.length && i < sortedIndices.length; i++) {
            population[sortedIndices[i].idx] = offspring[i];
            fitnesses[sortedIndices[i].idx] = null;  // Will be recalculated
        }
    }
    
    replaceTournament(population, fitnesses, offspring) {
        // For each offspring, select victim via reverse tournament
        for (let child of offspring) {
            let worstIdx = 0;
            let worstFitness = Infinity;
            
            // Reverse tournament - find worst among random individuals
            for (let i = 0; i < this.tournamentSize; i++) {
                const idx = Math.floor(Math.random() * population.length);
                if (fitnesses[idx] < worstFitness) {
                    worstFitness = fitnesses[idx];
                    worstIdx = idx;
                }
            }
            
            population[worstIdx] = child;
            fitnesses[worstIdx] = null;
        }
    }
    
    // Main Steady-State GA optimization loop
    optimize(sensingAngle) {
        console.log(`\n=== Steady-State GA Optimization for sensing angle: ${sensingAngle}° ===`);
        console.log(`Population Size: ${this.populationSize}`);
        console.log(`Offspring per Generation: ${this.offspringSize}`);
        console.log(`Replacement Strategy: ${this.replacementStrategy}`);
        console.log(`Max Evaluations: ${this.maxEvaluations}`);
        
        // Initialize population
        let population = this.initializePopulation();
        let fitnesses = new Array(this.populationSize).fill(null);
        
        // Evaluate initial population
        for (let i = 0; i < this.populationSize; i++) {
            fitnesses[i] = this.fitness(population[i], sensingAngle);
        }
        
        let bestIndividual = null;
        let bestFitness = -Infinity;
        let generation = 0;
        let stagnationCounter = 0;
        const maxStagnation = 1000;
        
        // Find initial best
        for (let i = 0; i < population.length; i++) {
            if (fitnesses[i] > bestFitness) {
                bestFitness = fitnesses[i];
                bestIndividual = this.cloneIndividual(population[i]);
            }
        }
        
        // Steady-State GA main loop
        while (this.evaluationCount < this.maxEvaluations) {
            generation++;
            
            // Generate offspring
            const offspring = [];
            
            for (let i = 0; i < this.offspringSize / 2; i++) {
                // Select parents
                const parent1 = this.tournamentSelection(population, fitnesses);
                const parent2 = this.tournamentSelection(population, fitnesses);
                
                // Crossover
                const [child1, child2] = this.crossover(parent1, parent2);
                
                // Mutation
                offspring.push(this.mutate(child1));
                if (offspring.length < this.offspringSize) {
                    offspring.push(this.mutate(child2));
                }
            }
            
            // Evaluate offspring
            for (let child of offspring) {
                this.fitness(child, sensingAngle);
            }
            
            // Replacement
            if (this.replacementStrategy === 'worst') {
                this.replaceWorst(population, fitnesses, offspring);
            } else {
                this.replaceTournament(population, fitnesses, offspring);
            }
            
            // Re-evaluate fitnesses that were invalidated
            for (let i = 0; i < population.length; i++) {
                if (fitnesses[i] === null) {
                    fitnesses[i] = this.fitness(population[i], sensingAngle);
                }
            }
            
            // Update age
            for (let ind of population) {
                ind.age++;
            }
            
            // Track best
            const currentBestFitness = Math.max(...fitnesses);
            const currentBestIdx = fitnesses.indexOf(currentBestFitness);
            
            if (currentBestFitness > bestFitness) {
                bestFitness = currentBestFitness;
                bestIndividual = this.cloneIndividual(population[currentBestIdx]);
                stagnationCounter = 0;
            } else {
                stagnationCounter++;
            }
            
            // Statistics
            if (generation % 100 === 0) {
                const avgFitness = fitnesses.reduce((a, b) => a + b) / fitnesses.length;
                const diversity = this.calculateDiversity(population);
                
                this.fitnessHistory.push({
                    generation,
                    evaluations: this.evaluationCount,
                    best: bestFitness,
                    avg: avgFitness,
                    diversity
                });
                
                console.log(`Gen ${generation} | Evals: ${this.evaluationCount} | Best: ${bestFitness.toFixed(6)} | Avg: ${avgFitness.toFixed(6)} | Diversity: ${diversity.toFixed(6)}`);
            }
            
            // Early stopping on stagnation
            if (stagnationCounter > maxStagnation) {
                console.log(`\nEarly stopping due to stagnation at generation ${generation}`);
                break;
            }
            
            // Restart diversity if too low
            if (generation % 500 === 0) {
                const diversity = this.calculateDiversity(population);
                if (diversity < 0.01) {
                    console.log(`Low diversity detected (${diversity.toFixed(6)}), injecting random individuals`);
                    // Replace 20% of population with random individuals (keep best)
                    const numToReplace = Math.floor(this.populationSize * 0.2);
                    const sortedIndices = fitnesses
                        .map((fitness, idx) => ({fitness, idx}))
                        .sort((a, b) => a.fitness - b.fitness);
                    
                    for (let i = 0; i < numToReplace; i++) {
                        const idx = sortedIndices[i].idx;
                        population[idx] = this.createIndividual();
                        fitnesses[idx] = this.fitness(population[idx], sensingAngle);
                    }
                }
            }
        }
        
        console.log(`\n=== Optimization Complete ===`);
        console.log(`Total Evaluations: ${this.evaluationCount}`);
        console.log(`Total Generations: ${generation}`);
        console.log(`Best Fitness: ${bestFitness.toFixed(6)}`);
        
        return {
            individual: bestIndividual,
            fitness: bestFitness,
            statistics: {
                generations: generation,
                evaluations: this.evaluationCount,
                fitnessHistory: this.fitnessHistory
            }
        };
    }
    
    // Generate radiation pattern for visualization
    getRadiationPattern(individual, sensingAngle) {
        const pattern = [];
        
        for (let angle of this.angles) {
            const a = this.arrayResponse(angle);
            
            let commResponse = new Complex(0, 0);
            for (let m = 0; m < this.M; m++) {
                commResponse = commResponse.add(a[m].multiply(individual.commWeights[m].conjugate()));
            }
            
            let sensingResponse = new Complex(0, 0);
            for (let m = 0; m < this.M; m++) {
                sensingResponse = sensingResponse.add(a[m].multiply(individual.sensingWeights[m].conjugate()));
            }
            
            const combined = new Complex(
                Math.sqrt(this.rho) * commResponse.real + Math.sqrt(1 - this.rho) * sensingResponse.real,
                Math.sqrt(this.rho) * commResponse.imag + Math.sqrt(1 - this.rho) * sensingResponse.imag
            );
            
            pattern.push({
                angle: angle,
                magnitude: combined.magnitude(),
                magnitudeDB: 20 * Math.log10(combined.magnitude() + 1e-10),
                commMagnitude: commResponse.magnitude(),
                sensingMagnitude: sensingResponse.magnitude()
            });
        }
        
        return pattern;
    }
    
    // Compare with standard GA results
    compareWithStandardGA(standardGAResult) {
        console.log("\n=== Comparison: SSGA vs Standard GA ===");
        console.log(`SSGA Evaluations: ${this.evaluationCount}`);
        console.log(`SSGA Best Fitness: ${this.fitnessHistory[this.fitnessHistory.length - 1].best.toFixed(6)}`);
        
        if (standardGAResult) {
            console.log(`Standard GA Best Fitness: ${standardGAResult.bestFitness.toFixed(6)}`);
            console.log(`Fitness Improvement: ${((this.fitnessHistory[this.fitnessHistory.length - 1].best - standardGAResult.bestFitness) / Math.abs(standardGAResult.bestFitness) * 100).toFixed(2)}%`);
        }
    }
}

// ============= Example Usage =============

const config = {
    M: 16,                    // 16-element ULA
    fc: 24e9,                 // 24 GHz
    commDirection: 0,         // Communication at 0°
    sensingDirections: [-54.3, -37.8, -24.4, -12.3, 10.8, 22.8, 35.9, 51.9],
    rho: 0.5,                 // 50% power to communication
    
    // SSGA specific parameters
    populationSize: 100,
    maxEvaluations: 20000,
    offspringSize: 2,         // Generate 2 offspring per generation
    mutationRate: 0.1,
    crossoverRate: 0.9,
    replacementStrategy: 'worst',  // 'worst' or 'tournament'
    tournamentSize: 3
};

console.log("=".repeat(70));
console.log("JCAS Multibeam Optimization - Steady-State Genetic Algorithm");
console.log("=".repeat(70));
console.log("\nConfiguration:");
console.log(JSON.stringify(config, null, 2));

const optimizer = new JCASMultibeamSSGA(config);

// Optimize for one sensing direction
const sensingAngle = -37.8;
const result = optimizer.optimize(sensingAngle);

console.log("\n" + "=".repeat(70));
console.log("RESULTS");
console.log("=".repeat(70));

console.log("\nBest Communication Weights (first 5):");
for (let i = 0; i < 5; i++) {
    const w = result.individual.commWeights[i];
    console.log(`  w_c[${i}] = ${w.real.toFixed(4)} + ${w.imag.toFixed(4)}j | Mag: ${w.magnitude().toFixed(4)} | Phase: ${(w.phase() * 180 / Math.PI).toFixed(2)}°`);
}

console.log("\nBest Sensing Weights (first 5):");
for (let i = 0; i < 5; i++) {
    const w = result.individual.sensingWeights[i];
    console.log(`  w_s[${i}] = ${w.real.toFixed(4)} + ${w.imag.toFixed(4)}j | Mag: ${w.magnitude().toFixed(4)} | Phase: ${(w.phase() * 180 / Math.PI).toFixed(2)}°`);
}

// Get radiation pattern
const pattern = optimizer.getRadiationPattern(result.individual, sensingAngle);

console.log("\n" + "=".repeat(70));
console.log("RADIATION PATTERN (Sample Points)");
console.log("=".repeat(70));
console.log("Angle(°) | Combined(dB) | Comm(dB) | Sensing(dB)");
console.log("-".repeat(70));

for (let i = 0; i < pattern.length; i += 16) {
    const p = pattern[i];
    console.log(
        `${p.angle.toFixed(1).padStart(6)} | ` +
        `${p.magnitudeDB.toFixed(2).padStart(11)} | ` +
        `${(20 * Math.log10(p.commMagnitude + 1e-10)).toFixed(2).padStart(8)} | ` +
        `${(20 * Math.log10(p.sensingMagnitude + 1e-10)).toFixed(2).padStart(11)}`
    );
}

// Display convergence statistics
console.log("\n" + "=".repeat(70));
console.log("CONVERGENCE HISTORY");
console.log("=".repeat(70));
console.log("Gen | Evaluations | Best Fitness | Avg Fitness | Diversity");
console.log("-".repeat(70));

const history = result.statistics.fitnessHistory;
const step = Math.max(1, Math.floor(history.length / 10));
for (let i = 0; i < history.length; i += step) {
    const h = history[i];
    console.log(
        `${h.generation.toString().padStart(3)} | ` +
        `${h.evaluations.toString().padStart(11)} | ` +
        `${h.best.toFixed(6).padStart(12)} | ` +
        `${h.avg.toFixed(6).padStart(11)} | ` +
        `${h.diversity.toFixed(6)}`
    );
}

// Performance metrics
console.log("\n" + "=".repeat(70));
console.log("PERFORMANCE METRICS");
console.log("=".repeat(70));

const finalHistory = history[history.length - 1];
console.log(`Final Best Fitness: ${finalHistory.best.toFixed(6)}`);
console.log(`Final Avg Fitness: ${finalHistory.avg.toFixed(6)}`);
console.log(`Final Diversity: ${finalHistory.diversity.toFixed(6)}`);
console.log(`Evaluations per Generation: ${(result.statistics.evaluations / result.statistics.generations).toFixed(2)}`);
console.log(`Convergence Speed: ${(finalHistory.best / result.statistics.evaluations * 1000).toFixed(6)} (fitness/1000 evals)`);

console.log("\n" + "=".repeat(70));
console.log("Optimization Complete!");
console.log("=".repeat(70));