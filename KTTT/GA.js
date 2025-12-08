// Genetic Algorithm - tối đa hoá f(x) = x^2
// Mỗi cá thể: binary string length = chromLength
// Selection: Tournament Selection
// Crossover: Single-point
// Mutation: Bit-flip
// Replacement: Generational (toàn bộ thế hệ mới thay thế cũ)

function randInt(max) { return Math.floor(Math.random() * max); }

function randProb() { return Math.random(); }

// --- parameters ---
const popSize = 20;
const chromLength = 5; // 5 bits => 0..31
const generations = 60;
const tournamentSize = 3;
const crossoverRate = 0.9;
const mutationRate = 0.02;

// --- utility: random chromosome ---
function randomChrom() {
  let bits = [];
  for (let i = 0; i < chromLength; i++) bits.push(Math.random() < 0.5 ? '0' : '1');
  return bits.join('');
}

// decode binary string -> integer
function decode(chrom) {
  return parseInt(chrom, 2);
}

// fitness function: maximize x^2
function fitness(chrom) {
  const x = decode(chrom);
  return x * x;
}

// create initial population
function initPopulation() {
  const pop = [];
  for (let i = 0; i < popSize; i++) pop.push({ chrom: randomChrom(), fitness: 0 });
  return pop;
}

// evaluate population (set fitness)
function evaluate(pop) {
  for (const ind of pop) ind.fitness = fitness(ind.chrom);
}

// tournament selection: pick best of k random individuals (with replacement)
function tournamentSelect(pop) {
  let best = null;
  for (let i = 0; i < tournamentSize; i++) {
    const candidate = pop[randInt(pop.length)];
    if (best === null || candidate.fitness > best.fitness) best = candidate;
  }
  // return a copy of the chromosome string
  return best.chrom;
}

// single-point crossover
function crossover(parent1, parent2) {
  if (randProb() > crossoverRate) return [parent1, parent2]; // no crossover
  const point = 1 + randInt(chromLength - 1); // crossover point in [1, chromLength-1]
  const child1 = parent1.slice(0, point) + parent2.slice(point);
  const child2 = parent2.slice(0, point) + parent1.slice(point);
  return [child1, child2];
}

// bit-flip mutation
function mutate(chrom) {
  let arr = chrom.split('');
  for (let i = 0; i < arr.length; i++) {
    if (randProb() < mutationRate) arr[i] = arr[i] === '0' ? '1' : '0';
  }
  return arr.join('');
}

// run GA
function runGA() {
  let population = initPopulation();
  evaluate(population);

  for (let gen = 0; gen < generations; gen++) {
    // record stats
    const best = population.reduce((a, b) => (a.fitness >= b.fitness ? a : b));
    const avg = population.reduce((s, ind) => s + ind.fitness, 0) / population.length;
    console.log(`Gen ${gen} | best x=${decode(best.chrom)} chrom=${best.chrom} fitness=${best.fitness} | avg=${avg.toFixed(2)}`);

    // create new population
    const newPop = [];
    while (newPop.length < popSize) {
      // selection
      const p1 = tournamentSelect(population);
      const p2 = tournamentSelect(population);

      // crossover
      const [c1, c2] = crossover(p1, p2);

      // mutate and push
      newPop.push({ chrom: mutate(c1), fitness: 0 });
      if (newPop.length < popSize) newPop.push({ chrom: mutate(c2), fitness: 0 });
    }

    population = newPop;
    evaluate(population);
  }

  // final best
  const best = population.reduce((a, b) => (a.fitness >= b.fitness ? a : b));
  console.log('--- DONE ---');
  console.log(`Best found: x=${decode(best.chrom)} chrom=${best.chrom} fitness=${best.fitness}`);
  return best;
}

// if (typeof module !== 'undefined' && require && typeof require.main !== 'undefined' && require.main === module) {
//   runGA();
// }

 runGA();