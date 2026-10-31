const { execSync } = require('child_process');

const NUM_EXECUCOES = 20;
const TEMPOS = [];

console.log(`Iniciando bateria de ${NUM_EXECUCOES} testes...\n`);

for (let i = 1; i <= NUM_EXECUCOES; i++) {
    const inicio = performance.now();
    
    execSync('node index.js', { stdio: 'ignore' }); 
    
    const fim = performance.now();
    const duracaoSegundos = (fim - inicio) / 1000;
    
    TEMPOS.push(duracaoSegundos);
    console.log(`Execução ${i}: ${duracaoSegundos.toFixed(3)}s`);
}

const temposValidos = TEMPOS.slice(1); 
const media = temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length;

console.log(`\n========================================`);
console.log(`Média de execução (excluindo a 1ª): ${media.toFixed(3)} segundos`);
console.log(`========================================`);