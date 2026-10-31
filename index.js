const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const RADIO_TERRA_METROS = 6371000;
const LIMITE_DISTANCIA_METROS = 20;
const CAMINHO_CSV = './datasets/dataset7.csv';
const PASTA_OUTPUT = './output';
const ARQUIVO_SAIDA = path.join(PASTA_OUTPUT, 'encontros.json');

function calcularHaversine(lat1, lon1, lat2, lon2) {
    const toRad = (graus) => (graus * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return RADIO_TERRA_METROS * c;
}

async function detectarEncontros() {
    console.time('Tempo de Execução Total');
    console.log(`Lendo ${CAMINHO_CSV}`)

    const dadosPorTimestamp = new Map();

    console.log('Lendo e processando o arquivo CSV...');
    await new Promise((resolve, reject) => {
        fs.createReadStream(CAMINHO_CSV)
            .pipe(csv({ separator: ";" }))
            .on('data', (row) => {
                const timestamp = row.timestamp;
                
                if (!dadosPorTimestamp.has(timestamp)) {
                    dadosPorTimestamp.set(timestamp, []);
                }

                dadosPorTimestamp.get(timestamp).push({
                    idMonitorado: Number(row.idMonitorado),
                    faccaoMonitorado: row.faccaoMonitorado ? row.faccaoMonitorado.trim() : '',
                    timestamp: row.timestamp,
                    latitude: parseFloat(row.latitude),
                    longitude: parseFloat(row.longitude),
                    medidaProtetiva: row.medidaProtetiva === 'true' || row.medidaProtetiva === '1',
                    idsRestricaoMedida: row.idsRestricaoMedida 
                        ? row.idsRestricaoMedida.split(',').map(id => Number(id.trim())) 
                        : []
                });
            })
            .on('end', resolve)
            .on('error', reject);
    });

    const encontrosDetectados = [];

    console.log('Calculando encontros físicos...');
    for (const [timestamp, registros] of dadosPorTimestamp.entries()) {
        const n = registros.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const p1 = registros[i];
                const p2 = registros[j];

                if (p1.idMonitorado === p2.idMonitorado) continue;

                const distancia = calcularHaversine(p1.latitude, p1.longitude, p2.latitude, p2.longitude);

                if (distancia < LIMITE_DISTANCIA_METROS) {
                    let tipoEncontro = null;
                    const idsEncontro = [p1.idMonitorado, p2.idMonitorado];

                    const p1eVitimaDeP2 = p1.medidaProtetiva && p1.idsRestricaoMedida.includes(p2.idMonitorado);
                    const p2eVitimaDeP1 = p2.medidaProtetiva && p2.idsRestricaoMedida.includes(p1.idMonitorado);

                    if (p1eVitimaDeP2 || p2eVitimaDeP1) {
                        tipoEncontro = "protetiva";
                    } else if (
                        p1.faccaoMonitorado && 
                        p2.faccaoMonitorado && 
                        p1.faccaoMonitorado === p2.faccaoMonitorado
                    ) {
                        tipoEncontro = "faccao";
                    } else {
                        tipoEncontro = "generico";
                    }

                    encontrosDetectados.push({
                        tipo: tipoEncontro,
                        monitoradosEncontro: idsEncontro,
                        timestamp: timestamp,
                        posicoes: {
                            [p1.idMonitorado]: { lat: p1.latitude, lon: p1.longitude },
                            [p2.idMonitorado]: { lat: p2.latitude, lon: p2.longitude }
                        },
                        distanciaMetros: distancia
                    });
                }
            }
        }
    }

    if (!fs.existsSync(PASTA_OUTPUT)) {
        fs.mkdirSync(PASTA_OUTPUT, { recursive: true });
    }

    fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(encontrosDetectados, null, 2), 'utf-8');
    console.log(`\nResultados salvos com sucesso em: ${ARQUIVO_SAIDA}`);
    console.log(`Total de encontros detectados: ${encontrosDetectados.length}`);

    console.timeEnd('Tempo de Execução Total');
}

detectarEncontros().catch(err => {
    console.error("Erro fatal ao processar os dados:", err);
});