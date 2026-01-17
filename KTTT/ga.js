// ============= JCAS Multibeam Optimization using Genetic Algorithm =============

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

class JCASMultibeamGA {
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
        
        // GA parameters
        this.populationSize = config.populationSize || 100;
        this.generations = config.generations || 200;
        this.mutationRate = config.mutationRate || 0.1;
        this.crossoverRate = config.crossoverRate || 0.8;
        this.eliteSize = config.eliteSize || 5;
        
        // Sampling points for array response
        this.K = config.K || 160;  // Number of sampling points
        this.angles = this.generateAngles();
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
            const individual = {
                commWeights: this.randomWeights(),
                sensingWeights: this.randomWeights()
            };
            population.push(individual);
        }
        return population;
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
        const commDesired = this.generateCommResponse();
        const sensingDesired = this.generateSensingResponse(sensingAngle);
        
        let mse = 0;
        
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
            
            // Combined multibeam response
            const combined = Complex.fromPolar(
                Math.sqrt(this.rho) * commResponse.magnitude() + 
                Math.sqrt(1 - this.rho) * sensingResponse.magnitude(),
                0
            );
            
            // Desired combined response
            const desired = Math.max(
                Math.sqrt(this.rho) * commDesired[k],
                Math.sqrt(1 - this.rho) * sensingDesired[k]
            );
            
            const error = combined.magnitude() - desired;
            mse += error * error;
        }
        
        return -mse;  // Negative because we want to maximize fitness
    }
    
    // Selection: Tournament selection
    selection(population, fitnesses, tournamentSize = 3) {
        let best = null;
        let bestFitness = -Infinity;
        
        for (let i = 0; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * population.length);
            if (fitnesses[idx] > bestFitness) {
                bestFitness = fitnesses[idx];
                best = population[idx];
            }
        }
        
        return best;
    }
    
    // Crossover: Single-point crossover
    crossover(parent1, parent2) {
        if (Math.random() > this.crossoverRate) {
            return [this.cloneIndividual(parent1), this.cloneIndividual(parent2)];
        }
        
        const point = Math.floor(Math.random() * this.M);
        
        const child1 = {
            commWeights: [
                ...parent1.commWeights.slice(0, point),
                ...parent2.commWeights.slice(point)
            ],
            sensingWeights: [
                ...parent1.sensingWeights.slice(0, point),
                ...parent2.sensingWeights.slice(point)
            ]
        };
        
        const child2 = {
            commWeights: [
                ...parent2.commWeights.slice(0, point),
                ...parent1.commWeights.slice(point)
            ],
            sensingWeights: [
                ...parent2.sensingWeights.slice(0, point),
                ...parent1.sensingWeights.slice(point)
            ]
        };
        
        child1.commWeights = this.normalizeWeights(child1.commWeights);
        child1.sensingWeights = this.normalizeWeights(child1.sensingWeights);
        child2.commWeights = this.normalizeWeights(child2.commWeights);
        child2.sensingWeights = this.normalizeWeights(child2.sensingWeights);
        
        return [child1, child2];
    }
    
    // Mutation: Random perturbation
    mutate(individual) {
        const mutated = this.cloneIndividual(individual);
        
        for (let m = 0; m < this.M; m++) {
            if (Math.random() < this.mutationRate) {
                const deltaMag = (Math.random() - 0.5) * 0.2;
                const deltaPhase = (Math.random() - 0.5) * Math.PI / 4;
                
                const oldMag = mutated.commWeights[m].magnitude();
                const oldPhase = mutated.commWeights[m].phase();
                
                mutated.commWeights[m] = Complex.fromPolar(
                    Math.max(0, oldMag + deltaMag),
                    oldPhase + deltaPhase
                );
            }
            
            if (Math.random() < this.mutationRate) {
                const deltaMag = (Math.random() - 0.5) * 0.2;
                const deltaPhase = (Math.random() - 0.5) * Math.PI / 4;
                
                const oldMag = mutated.sensingWeights[m].magnitude();
                const oldPhase = mutated.sensingWeights[m].phase();
                
                mutated.sensingWeights[m] = Complex.fromPolar(
                    Math.max(0, oldMag + deltaMag),
                    oldPhase + deltaPhase
                );
            }
        }
        
        mutated.commWeights = this.normalizeWeights(mutated.commWeights);
        mutated.sensingWeights = this.normalizeWeights(mutated.sensingWeights);
        
        return mutated;
    }
    
    cloneIndividual(individual) {
        return {
            commWeights: individual.commWeights.map(w => new Complex(w.real, w.imag)),
            sensingWeights: individual.sensingWeights.map(w => new Complex(w.real, w.imag))
        };
    }
    
    // Main optimization loop
    optimize(sensingAngle) {
        console.log(`\n=== Optimizing for sensing angle: ${sensingAngle}° ===`);
        
        let population = this.initializePopulation();
        let bestIndividual = null;
        let bestFitness = -Infinity;
        
        for (let gen = 0; gen < this.generations; gen++) {
            // Evaluate fitness
            const fitnesses = population.map(ind => this.fitness(ind, sensingAngle));
            
            // Track best
            const maxFitness = Math.max(...fitnesses);
            const maxIdx = fitnesses.indexOf(maxFitness);
            
            if (maxFitness > bestFitness) {
                bestFitness = maxFitness;
                bestIndividual = this.cloneIndividual(population[maxIdx]);
            }
            
            // Log progress
            if (gen % 20 === 0 || gen === this.generations - 1) {
                console.log(`Generation ${gen}: Best Fitness = ${bestFitness.toFixed(6)}, Avg = ${(fitnesses.reduce((a,b) => a+b) / fitnesses.length).toFixed(6)}`);
            }
            
            // Create new population
            const newPopulation = [];
            
            // Elitism: keep best individuals
            const sortedIndices = fitnesses
                .map((fitness, idx) => ({fitness, idx}))
                .sort((a, b) => b.fitness - a.fitness)
                .map(x => x.idx);
            
            for (let i = 0; i < this.eliteSize; i++) {
                newPopulation.push(this.cloneIndividual(population[sortedIndices[i]]));
            }
            
            // Generate offspring
            while (newPopulation.length < this.populationSize) {
                const parent1 = this.selection(population, fitnesses);
                const parent2 = this.selection(population, fitnesses);
                
                const [child1, child2] = this.crossover(parent1, parent2);
                
                newPopulation.push(this.mutate(child1));
                if (newPopulation.length < this.populationSize) {
                    newPopulation.push(this.mutate(child2));
                }
            }
            
            population = newPopulation;
        }
        
        return bestIndividual;
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
                magnitudeDB: 20 * Math.log10(combined.magnitude() + 1e-10)
            });
        }
        
        return pattern;
    }
}

// ============= Example Usage =============

const config = {
    M: 16,                    // 16-element ULA
    fc: 24e9,                 // 24 GHz
    commDirection: 0,         // Communication at 0°
    sensingDirections: [-54.3, -37.8, -24.4, -12.3, 10.8, 22.8, 35.9, 51.9],
    rho: 0.5,                 // 50% power to communication
    populationSize: 100,
    generations: 200,
    mutationRate: 0.1,
    crossoverRate: 0.8,
    eliteSize: 5
};

console.log("Starting JCAS Multibeam Optimization with Genetic Algorithm");
console.log("System Configuration:", config);

const optimizer = new JCASMultibeamGA(config);

// Optimize for one sensing direction (can loop through all)
const sensingAngle = -37.8;
const result = optimizer.optimize(sensingAngle);

console.log("\n=== Optimization Complete ===");
console.log("Best Communication Weights (first 4):");
for (let i = 0; i < 4; i++) {
    console.log(`  w_c[${i}] = ${result.commWeights[i].real.toFixed(4)} + ${result.commWeights[i].imag.toFixed(4)}j`);
}

console.log("\nBest Sensing Weights (first 4):");
for (let i = 0; i < 4; i++) {
    console.log(`  w_s[${i}] = ${result.sensingWeights[i].real.toFixed(4)} + ${result.sensingWeights[i].imag.toFixed(4)}j`);
}

// Get radiation pattern
const pattern = optimizer.getRadiationPattern(result, sensingAngle);
console.log("\n=== Radiation Pattern (sample points) ===");
for (let i = 0; i < pattern.length; i += 20) {
    console.log(`Angle: ${pattern[i].angle.toFixed(1)}°, Magnitude (dB): ${pattern[i].magnitudeDB.toFixed(2)}`);
}