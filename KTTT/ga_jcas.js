/******************** 1. SYSTEM PARAMETERS ********************/
const N_ANTENNAS = 8;

const POP_SIZE = 50;
const GENERATIONS = 150;
const CROSS_RATE = 0.8;
const MUT_RATE = 0.1;

const COMM_ANGLE = 0;
const SENSING_ANGLES = [-40, -20, 20, 40];

/******************** 2. UTILITY FUNCTIONS ********************/
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

/******************** 3. CHROMOSOME ********************/
function randomChromosome() {
  const chrom = [];
  for (let i = 0; i < N_ANTENNAS; i++) {
    chrom.push(rand(0, 1));
    chrom.push(rand(0, 2 * Math.PI));
  }
  return chrom;
}

/******************** 4. ARRAY FACTOR ********************/
function arrayFactor(chrom, angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  let real = 0, imag = 0;

  for (let i = 0; i < N_ANTENNAS; i++) {
    const a = chrom[2 * i];
    const phi = chrom[2 * i + 1];
    const phaseShift = i * Math.sin(angle);

    real += a * Math.cos(phi + phaseShift);
    imag += a * Math.sin(phi + phaseShift);
  }
  return Math.sqrt(real * real + imag * imag);
}

/******************** 5. FITNESS ********************/
function fitness(chrom) {
  const commPower = arrayFactor(chrom, COMM_ANGLE);

  let sensingPower = 0;
  for (const ang of SENSING_ANGLES) {
    sensingPower += arrayFactor(chrom, ang);
  }
  sensingPower /= SENSING_ANGLES.length;

  let sidelobe = 0;
  for (let ang = -90; ang <= 90; ang += 10) {
    const nearComm = Math.abs(ang - COMM_ANGLE) <= 10;
    const nearSensing = SENSING_ANGLES.includes(ang);
    if (!nearComm && !nearSensing) {
      sidelobe += arrayFactor(chrom, ang);
    }
  }

  return 2.0 * commPower + 1.0 * sensingPower - 0.5 * sidelobe;
}

/******************** 6. SELECTION ********************/
function tournamentSelection(pop) {
  const k = 3;
  let best = null;
  for (let i = 0; i < k; i++) {
    const ind = pop[Math.floor(Math.random() * pop.length)];
    if (!best || ind.fitness > best.fitness) best = ind;
  }
  return best.chrom;
}

/******************** 7. CROSSOVER ********************/
function crossover(p1, p2) {
  if (Math.random() > CROSS_RATE) {
    return [p1.slice(), p2.slice()];
  }
  const point = Math.floor(Math.random() * p1.length);
  return [
    p1.slice(0, point).concat(p2.slice(point)),
    p2.slice(0, point).concat(p1.slice(point))
  ];
}

/******************** 8. MUTATION ********************/
function mutate(chrom) {
  for (let i = 0; i < chrom.length; i++) {
    if (Math.random() < MUT_RATE) {
      if (i % 2 === 0)
        chrom[i] = clamp(chrom[i] + rand(-0.1, 0.1), 0, 1);
      else
        chrom[i] = (chrom[i] + rand(-0.2, 0.2)) % (2 * Math.PI);
    }
  }
}

/******************** 9. GA LOOP ********************/
let population = Array.from({ length: POP_SIZE }, () => {
  const chrom = randomChromosome();
  return { chrom, fitness: fitness(chrom) };
});

const fitnessHistory = [];

for (let gen = 0; gen < GENERATIONS; gen++) {
  const newPop = [];

  while (newPop.length < POP_SIZE) {
    const p1 = tournamentSelection(population);
    const p2 = tournamentSelection(population);
    const [c1, c2] = crossover(p1, p2);
    mutate(c1); mutate(c2);

    newPop.push({ chrom: c1, fitness: fitness(c1) });
    if (newPop.length < POP_SIZE)
      newPop.push({ chrom: c2, fitness: fitness(c2) });
  }

  population = newPop;
  const best = population.reduce((a, b) => a.fitness > b.fitness ? a : b);
  fitnessHistory.push(best.fitness);
}

/******************** 10. PLOTTING ********************/
const bestChrom = population.reduce((a, b) =>
  a.fitness > b.fitness ? a : b
).chrom;

// Fitness curve
new Chart(document.getElementById("fitnessChart"), {
  type: "line",
  data: {
    labels: fitnessHistory.map((_, i) => i),
    datasets: [{
      label: "Best Fitness",
      data: fitnessHistory,
      borderColor: "blue",
      fill: false
    }]
  }
});

// Beam pattern
const angles = [];
const beam = [];
for (let a = -90; a <= 90; a++) {
  angles.push(a);
  beam.push(arrayFactor(bestChrom, a));
}

new Chart(document.getElementById("beamChart"), {
  type: "line",
  data: {
    labels: angles,
    datasets: [{
      label: "Beam Pattern",
      data: beam,
      borderColor: "red",
      fill: false
    }]
  }
});
