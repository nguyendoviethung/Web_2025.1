/**
 * Main file: Chạy và so sánh Standard GA vs Steady State GA
 */

const GeneticAlgorithm = require('./genetic-algorithm.js');
const SteadyStateGA = require('./steady-state-ga.js');
const fs = require('fs');

/**
 * Cấu hình chung
 */
const commonParams = {
    M: 16,                    // Số phần tử antenna
    populationSize: 100,      // Kích thước quần thể
    maxGenerations: 200,      // Số thế hệ
    crossoverRate: 0.8,       // Tỷ lệ lai ghép
    mutationRate: 0.1,        // Tỷ lệ đột biến
    
    // Tham số bài toán
    thetaComm: 0,             // Communication direction (degrees)
    thetaSense: [30, 45, 60], // Sensing directions (degrees)
    Gmin: 0.5,                // Minimum sensing gain
    SLmax: 0.1,               // Maximum sidelobe level
    
    // Hệ số fitness
    alpha1: 1.0,              // Communication weight
    alpha2: 0.5,              // Sensing penalty weight
    alpha3: 0.3               // Sidelobe penalty weight
};

/**
 * Run experiments
 */
function runExperiments() {
    console.log("======================================");
    console.log("BÀI TOÁN: Tối ưu hóa Multibeam cho JCAS");
    console.log("======================================\n");
    
    console.log("Tham số bài toán:");
    console.log(`  - Số phần tử antenna: ${commonParams.M}`);
    console.log(`  - Communication direction: ${commonParams.thetaComm}°`);
    console.log(`  - Sensing directions: ${commonParams.thetaSense.join(', ')}°`);
    console.log(`  - Minimum sensing gain: ${commonParams.Gmin}`);
    console.log(`  - Maximum sidelobe level: ${commonParams.SLmax}`);
    console.log("\n");
    
    // 1. Run Standard GA
    console.log("THỰC NGHIỆM 1: Standard Genetic Algorithm");
    console.log("==========================================\n");
    
    const ga = new GeneticAlgorithm({
        ...commonParams,
        elitismRate: 0.1
    });
    
    const gaResults = ga.run();
    console.log("\n");
    
    // 2. Run Steady State GA
    console.log("THỰC NGHIỆM 2: Steady State Genetic Algorithm");
    console.log("==============================================\n");
    
    const ssga = new SteadyStateGA({
        ...commonParams,
        replacementCount: 2
    });
    
    const ssgaResults = ssga.run();
    console.log("\n");
    
    // 3. So sánh kết quả
    console.log("SO SÁNH KẾT QUẢ");
    console.log("=================\n");
    
    console.log("Standard GA:");
    console.log(`  Best Fitness: ${gaResults.bestFitness.fitness.toFixed(4)}`);
    console.log(`  Communication Gain: ${gaResults.bestFitness.commGain.toFixed(4)}`);
    console.log(`  Sensing Penalty: ${gaResults.bestFitness.sensingPenalty.toFixed(4)}`);
    console.log(`  Sidelobe Penalty: ${gaResults.bestFitness.sidelobePenalty.toFixed(4)}`);
    console.log("");
    
    console.log("Steady State GA:");
    console.log(`  Best Fitness: ${ssgaResults.bestFitness.fitness.toFixed(4)}`);
    console.log(`  Communication Gain: ${ssgaResults.bestFitness.commGain.toFixed(4)}`);
    console.log(`  Sensing Penalty: ${ssgaResults.bestFitness.sensingPenalty.toFixed(4)}`);
    console.log(`  Sidelobe Penalty: ${ssgaResults.bestFitness.sidelobePenalty.toFixed(4)}`);
    console.log("");
    
    // Tính toán radiation patterns
    console.log("Đang tính toán radiation patterns...");
    const gaPattern = ga.radiationPattern(gaResults.bestIndividual);
    const ssgaPattern = ssga.radiationPattern(ssgaResults.bestIndividual);
    
    // 4. Lưu kết quả ra file JSON
    const results = {
        parameters: commonParams,
        standardGA: {
            bestFitness: gaResults.bestFitness,
            convergenceHistory: gaResults.history,
            radiationPattern: gaPattern
        },
        steadyStateGA: {
            bestFitness: ssgaResults.bestFitness,
            convergenceHistory: ssgaResults.history,
            radiationPattern: ssgaPattern
        }
    };
    
    fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
    console.log("Kết quả đã được lưu vào file 'results.json'\n");
    
    // 5. Tạo HTML để visualize
    generateVisualizationHTML(results);
    console.log("Đã tạo file 'visualization.html' để xem đồ thị\n");
    
    return results;
}

/**
 * Generate HTML file for visualization
 */
function generateVisualizationHTML(results) {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kết quả tối ưu hóa Multibeam</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1, h2 {
            color: #2c3e50;
        }
        .container {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .chart {
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #3498db;
            color: white;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .metric {
            display: inline-block;
            margin: 10px;
            padding: 15px;
            background: #ecf0f1;
            border-radius: 5px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2980b9;
        }
        .metric-label {
            font-size: 14px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <h1>🎯 Kết quả Tối ưu hóa Multibeam cho JCAS</h1>
    
    <div class="container">
        <h2>📊 Thông số bài toán</h2>
        <table>
            <tr>
                <th>Tham số</th>
                <th>Giá trị</th>
            </tr>
            <tr>
                <td>Số phần tử antenna (M)</td>
                <td>${results.parameters.M}</td>
            </tr>
            <tr>
                <td>Communication direction</td>
                <td>${results.parameters.thetaComm}°</td>
            </tr>
            <tr>
                <td>Sensing directions</td>
                <td>${results.parameters.thetaSense.join(', ')}°</td>
            </tr>
            <tr>
                <td>Minimum sensing gain (G_min)</td>
                <td>${results.parameters.Gmin}</td>
            </tr>
            <tr>
                <td>Maximum sidelobe level (SL_max)</td>
                <td>${results.parameters.SLmax}</td>
            </tr>
            <tr>
                <td>Population size</td>
                <td>${results.parameters.populationSize}</td>
            </tr>
            <tr>
                <td>Max generations</td>
                <td>${results.parameters.maxGenerations}</td>
            </tr>
        </table>
    </div>
    
    <div class="container">
        <h2>🏆 So sánh Kết quả</h2>
        <div>
            <div class="metric">
                <div class="metric-label">Standard GA - Best Fitness</div>
                <div class="metric-value">${results.standardGA.bestFitness.fitness.toFixed(4)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Steady State GA - Best Fitness</div>
                <div class="metric-value">${results.steadyStateGA.bestFitness.fitness.toFixed(4)}</div>
            </div>
        </div>
        
        <table>
            <tr>
                <th>Metric</th>
                <th>Standard GA</th>
                <th>Steady State GA</th>
            </tr>
            <tr>
                <td>Communication Gain</td>
                <td>${results.standardGA.bestFitness.commGain.toFixed(4)}</td>
                <td>${results.steadyStateGA.bestFitness.commGain.toFixed(4)}</td>
            </tr>
            <tr>
                <td>Sensing Penalty</td>
                <td>${results.standardGA.bestFitness.sensingPenalty.toFixed(4)}</td>
                <td>${results.steadyStateGA.bestFitness.sensingPenalty.toFixed(4)}</td>
            </tr>
            <tr>
                <td>Sidelobe Penalty</td>
                <td>${results.standardGA.bestFitness.sidelobePenalty.toFixed(4)}</td>
                <td>${results.steadyStateGA.bestFitness.sidelobePenalty.toFixed(4)}</td>
            </tr>
        </table>
    </div>
    
    <div class="container">
        <h2>📈 Convergence History - Best Fitness</h2>
        <div id="convergenceBest" class="chart"></div>
    </div>
    
    <div class="container">
        <h2>📈 Convergence History - Average Fitness</h2>
        <div id="convergenceAvg" class="chart"></div>
    </div>
    
    <div class="container">
        <h2>📡 Radiation Pattern - Linear Scale</h2>
        <div id="radiationLinear" class="chart"></div>
    </div>
    
    <div class="container">
        <h2>📡 Radiation Pattern - dB Scale</h2>
        <div id="radiationDB" class="chart"></div>
    </div>
    
    <div class="container">
        <h2>🎯 Radiation Pattern - Polar Plot</h2>
        <div id="radiationPolar" class="chart"></div>
    </div>
    
    <script>
        const results = ${JSON.stringify(results)};
        
        // 1. Convergence - Best Fitness
        const generations = Array.from({length: results.standardGA.convergenceHistory.bestFitness.length}, 
                                      (_, i) => i);
        
        Plotly.newPlot('convergenceBest', [
            {
                x: generations,
                y: results.standardGA.convergenceHistory.bestFitness,
                mode: 'lines',
                name: 'Standard GA',
                line: {color: '#3498db', width: 2}
            },
            {
                x: generations,
                y: results.steadyStateGA.convergenceHistory.bestFitness,
                mode: 'lines',
                name: 'Steady State GA',
                line: {color: '#e74c3c', width: 2}
            }
        ], {
            title: 'Convergence của Best Fitness theo Generation',
            xaxis: {title: 'Generation'},
            yaxis: {title: 'Best Fitness'},
            hovermode: 'x unified'
        });
        
        // 2. Convergence - Average Fitness
        Plotly.newPlot('convergenceAvg', [
            {
                x: generations,
                y: results.standardGA.convergenceHistory.avgFitness,
                mode: 'lines',
                name: 'Standard GA',
                line: {color: '#3498db', width: 2, dash: 'dash'}
            },
            {
                x: generations,
                y: results.steadyStateGA.convergenceHistory.avgFitness,
                mode: 'lines',
                name: 'Steady State GA',
                line: {color: '#e74c3c', width: 2, dash: 'dash'}
            }
        ], {
            title: 'Convergence của Average Fitness theo Generation',
            xaxis: {title: 'Generation'},
            yaxis: {title: 'Average Fitness'},
            hovermode: 'x unified'
        });
        
        // 3. Radiation Pattern - Linear Scale
        const gaAngles = results.standardGA.radiationPattern.map(p => p.angle);
        const gaGains = results.standardGA.radiationPattern.map(p => p.gain);
        const ssgaAngles = results.steadyStateGA.radiationPattern.map(p => p.angle);
        const ssgaGains = results.steadyStateGA.radiationPattern.map(p => p.gain);
        
        Plotly.newPlot('radiationLinear', [
            {
                x: gaAngles,
                y: gaGains,
                mode: 'lines',
                name: 'Standard GA',
                line: {color: '#3498db', width: 2}
            },
            {
                x: ssgaAngles,
                y: ssgaGains,
                mode: 'lines',
                name: 'Steady State GA',
                line: {color: '#e74c3c', width: 2}
            },
            // Communication direction
            {
                x: [${results.parameters.thetaComm}, ${results.parameters.thetaComm}],
                y: [0, Math.max(...gaGains, ...ssgaGains)],
                mode: 'lines',
                name: 'Communication',
                line: {color: 'green', width: 2, dash: 'dot'}
            },
            // Sensing directions
            ${results.parameters.thetaSense.map((theta, i) => `
            {
                x: [${theta}, ${theta}],
                y: [0, Math.max(...gaGains, ...ssgaGains)],
                mode: 'lines',
                name: 'Sensing ${i+1}',
                line: {color: 'orange', width: 1, dash: 'dot'}
            }`).join(',')}
        ], {
            title: 'Radiation Pattern (Linear Scale)',
            xaxis: {title: 'Angle (degrees)'},
            yaxis: {title: 'Gain'},
            hovermode: 'x unified'
        });
        
        // 4. Radiation Pattern - dB Scale
        const gaGainsDB = gaGains.map(g => 10 * Math.log10(Math.max(g, 1e-10)));
        const ssgaGainsDB = ssgaGains.map(g => 10 * Math.log10(Math.max(g, 1e-10)));
        
        Plotly.newPlot('radiationDB', [
            {
                x: gaAngles,
                y: gaGainsDB,
                mode: 'lines',
                name: 'Standard GA',
                line: {color: '#3498db', width: 2}
            },
            {
                x: ssgaAngles,
                y: ssgaGainsDB,
                mode: 'lines',
                name: 'Steady State GA',
                line: {color: '#e74c3c', width: 2}
            },
            // Reference lines
            {
                x: [${results.parameters.thetaComm}, ${results.parameters.thetaComm}],
                y: [Math.min(...gaGainsDB, ...ssgaGainsDB), 
                    Math.max(...gaGainsDB, ...ssgaGainsDB)],
                mode: 'lines',
                name: 'Communication',
                line: {color: 'green', width: 2, dash: 'dot'}
            }
        ], {
            title: 'Radiation Pattern (dB Scale)',
            xaxis: {title: 'Angle (degrees)'},
            yaxis: {title: 'Gain (dB)'},
            hovermode: 'x unified'
        });
        
        // 5. Polar Plot
        Plotly.newPlot('radiationPolar', [
            {
                type: 'scatterpolar',
                r: gaGains,
                theta: gaAngles,
                mode: 'lines',
                name: 'Standard GA',
                line: {color: '#3498db', width: 2}
            },
            {
                type: 'scatterpolar',
                r: ssgaGains,
                theta: ssgaAngles,
                mode: 'lines',
                name: 'Steady State GA',
                line: {color: '#e74c3c', width: 2}
            }
        ], {
            title: 'Radiation Pattern (Polar)',
            polar: {
                radialaxis: {
                    visible: true,
                    range: [0, Math.max(...gaGains, ...ssgaGains)]
                }
            },
            showlegend: true
        });
    </script>
</body>
</html>`;
    
    fs.writeFileSync('visualization.html', html);
}

// Run
if (require.main === module) {
    runExperiments();
}

module.exports = { runExperiments };
