/*
Bài toán: Tìm số nguyên từ 0 đến 31 sao cho hàm fitness = x² lớn nhất.
Cách làm:
1.Mỗi cá thể biểu diễn bằng 5 bit nhị phân (0 → 31).
2.Sử dụng: Tournament Selection, Single-Point Crossover, Bit-Flip Mutation.
3.Thế hệ mới hoàn toàn (Generational GA). 
*/

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fitness(x) {
  return x * x;
}

function randomIndividual(bitLength = 5) {
  let ind = [];
  for (let i = 0; i < bitLength; i++) ind.push(Math.random() < 0.5 ? 0 : 1);
  return ind;
}

function decode(individual) {
  return individual.reduce((sum, bit, i) => sum + bit * Math.pow(2, individual.length - 1 - i), 0);
}

function tournamentSelection(pop, k = 2) {
  let sample = [];
  for (let i = 0; i < k; i++) sample.push(pop[randomInt(0, pop.length - 1)]);
  sample.sort((a, b) => fitness(decode(b)) - fitness(decode(a)));
  return sample[0];
}

function crossover(p1, p2) {
  let point = randomInt(1, p1.length - 1);
  let c1 = p1.slice(0, point).concat(p2.slice(point));
  let c2 = p2.slice(0, point).concat(p1.slice(point));
  return [c1, c2];
}

function mutate(ind, pm = 0.1) {
  return ind.map(bit => (Math.random() < pm ? 1 - bit : bit));
}

const POP_SIZE = 6;
const GEN = 10;

let population = [];
for (let i = 0; i < POP_SIZE; i++) population.push(randomIndividual());

for (let g = 0; g < GEN; g++) {
  let newPopulation = [];
  while (newPopulation.length < POP_SIZE) {
    let p1 = tournamentSelection(population);
    let p2 = tournamentSelection(population);
    let [c1, c2] = crossover(p1, p2);
    newPopulation.push(mutate(c1));
    if (newPopulation.length < POP_SIZE) newPopulation.push(mutate(c2));
  }
  population = newPopulation;
  let best = population.reduce((a, b) => (fitness(decode(a)) > fitness(decode(b)) ? a : b));
  console.log(`Gen ${g + 1}: Best x = ${decode(best)}, Fitness = ${fitness(decode(best))}`);
}
