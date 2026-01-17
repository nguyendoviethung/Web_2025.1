const obj = { a:1 , b:2, c:3, d:4 };
const { a : a1 , b : b1, ...rest } = obj;
console.log(rest); 