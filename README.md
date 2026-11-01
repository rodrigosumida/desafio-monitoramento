# Detector de Encontros Geolocalizados

Este algoritmo desenvolvido em Node.js para processamento de dados de geolocalização de pessoas monitoradas (tornozeleira eletrônica e medidas protetivas). O sistema analisa coordenadas de latitude e longitude, calcula distâncias físicas utilizando a Fórmula de Haversine e detecta encontros físicos com base em um raio limite de 20 metros dentro do mesmo registro temporal.

### Formato dos arquivos de entrada

*idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida*

* idMonitorado: Define o id da pessoa monitorada, podendo ser usuário de tornozeleira ou vítima de medida protetiva.

* faccaoMonitorado: Define o id da facção do monitorado (pode ser vazio; apenas usuários de tornozeleira possuem esse campo preenchido).

* timestamp: Data do posicionamento no formato YYYY-MM-DD HH:MM:SS.

* latitude: Latitude do posicionamento no formato float com 5 casas decimais.

* longitude: Longitude do posicionamento no formato float com 5 casas decimais.

* medidaProtetiva: Booleano que indica se a pessoa monitorada tem medida protetiva ou não.

* idsRestricaoMedida: Array de Ids dos monitorados agressores, caso a pessoa possua medida protetiva, no formato "1,2,3,...n".

Os datasets utilizados podem ser encontrados [aqui](https://drive.google.com/drive/folders/1b0HvAGjGHeSr8Qkd4w1gJYoQiLwgiE87?usp=drive_link)

## Lógica utilizada

O algoritmo utiliza a biblioteca csv-parser para ler o arquivo .csv de forma eficiente em fluxos de dados.

Os registros são então agrupados pela timestamp para que as comparações sejam feitas apenas entre as pessoas que registraram posição naquele momento.

O cálculo da distância entre indivíduos é feito utilizando a Fórmula de Haversine, considerando o raio da Terra como 6.371.000 metros.

Caso a distância entre dois indivíduos seja menor que 20 metros, o encontro é classificado entre três categorias:

* Encontros genéricos: Encontro entre quaisquer dois monitorados.
* Encontros de facções: Encontro entre dois monitorados que pertencem à mesma facção.
* Encontros de medidas protetivas: Encontro entre um agressor e sua respectiva vítima.
    * Um encontro é considerado de medidas protetivas quando *medidaProtetiva* é **true** e o *idMonitorado* de um dos indivíduos está presente em *idsRestricaoMedida* do outro

O algoritmo salva os resultados dos encontros na pasta *output/* no arquivo *encontros.json*. O tempo de execução é disponibilizado no console.

## Como utilizar

1. Certifique de ter o [Node.js](https://nodejs.org) instalado na sua máquina
2. Instale as dependências usando `npm install`.
3. Coloque o arquivo .csv dentro da pasta *datasets/*. Os arquivos de entrada devem utilizar separação por ponto e vírgula (;).
4. Dentro de *index.js*, altere a variável **CAMINHO_CSV** para o caminho para o seu arquivo. *Deverá ser algo como './datasets/seu_arquivo_aqui.csv'*.
5. Rode o script no terminal usando `node index.js`.

Após concluido, deverá ser gerado um arquivo chamado *encontros.json* na pasta *output/* no seguinte formato:

```json
[{
    "tipo": "faccao", 
    "monitoradosEncontro": [40, 44],
    "timestamp": "2024-01-01 00:01:50",
    "posicoes": { 
      "40": { "lat": -10.07996, "lon": -37.08384 }, 
      "44": { "lat": -10.07987, "lon": -37.08389 } 
    },
    "distanciaMetros": 11.406788673336607
}]
```

## Relatório de desempenho

Cada dataset foi executado 10 vezes. A primeira execução (aquecimento/JIT do V8 e cache do SO) foi descartada, calculando-se a média, o menor e o maior tempo a partir das execuções seguintes (excluindo anomalias). Tempos individuais podem ser checados no arquivo *time.txt*.

### Configurações da máquina

Intel i5-12400F\
GeForce RTX 2060 Super 8GB\
16GB DDR4\
SSD 240GB

### Dataset 1

Total de encontros detectados: 4

Resultados:
* Menor tempo: 19.301ms
* Maior tempo: 23.785ms
* Tempo médio: 21.1485ms

### Dataset 2

Total de encontros detectados: 6

Resultados:
* Menor tempo: 56.224ms
* Maior tempo: 66.669ms
* Tempo médio: 59.7274ms

### Dataset 3

Total de encontros detectados: 10

Resultados:
* Menor tempo: 209.896ms
* Maior tempo: 234.611ms
* Tempo médio: 216.6900ms

### Dataset 4

Total de encontros detectados: 15

Resultados:
* Menor tempo: 877.052ms
* Maior tempo: 932.301ms
* Tempo médio: 899.6375ms

### Dataset 5

Total de encontros detectados: 21

Resultados:
* Menor tempo: 2.475s
* Maior tempo: 2.556s
* Tempo médio: 2.5241s

### Dataset 6

Total de encontros detectados: 27

Resultados:
* Menor tempo: 21.729s
* Maior tempo: 23.280s
* Tempo médio: 22.1157s

### Dataset 7

Total de encontros detectados: 35

Resultados:
* Menor tempo: 37.261s
* Maior tempo: 44.462s
* Tempo médio: 39.6219s