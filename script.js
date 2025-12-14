// FIRE 计划计算器 - JavaScript 代码

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认值（如果输入框为空）并格式化显示
    const initialAmountInput = document.getElementById('initialAmount');
    if (!initialAmountInput.value) {
        initialAmountInput.value = '1,000,000';
    } else {
        initialAmountInput.value = formatNumberInput(initialAmountInput.value);
    }
    
    const interestRateInput = document.getElementById('interestRate');
    if (!interestRateInput.value) {
        interestRateInput.value = '1.30';
    }
    
    const annualWithdrawalInput = document.getElementById('annualWithdrawal');
    if (!annualWithdrawalInput.value) {
        annualWithdrawalInput.value = '100,000';
    } else {
        annualWithdrawalInput.value = formatNumberInput(annualWithdrawalInput.value);
    }
    
    const yearsInput = document.getElementById('years');
    if (!yearsInput.value) {
        yearsInput.value = '30';
    }
    
    // 为金额输入框添加格式化事件
    [initialAmountInput, annualWithdrawalInput].forEach(input => {
        // 失去焦点时格式化
        input.addEventListener('blur', function() {
            const value = parseNumber(this.value);
            if (value !== null) {
                this.value = formatNumberInput(value);
            } else if (this.value.trim() === '') {
                this.value = '';
            }
        });
        
        // 输入时实时格式化（可选，但可能会影响输入体验）
        // 这里只处理失去焦点时格式化，避免输入时干扰
    });

    // 支持回车键计算
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
});

function calculate() {
    // 解析输入值，移除逗号
    const initialAmount = parseNumber(document.getElementById('initialAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value) || null;
    const years = parseFloat(document.getElementById('years').value) || null;
    const annualWithdrawal = parseNumber(document.getElementById('annualWithdrawal').value);

    const errorDiv = document.getElementById('errorMessage');
    errorDiv.innerHTML = '';

    // 验证输入
    const inputs = { initialAmount, interestRate, years, annualWithdrawal };
    const filledInputs = Object.entries(inputs).filter(([key, value]) => 
        value !== null && !isNaN(value) && value > 0
    );

    if (filledInputs.length < 2) {
        errorDiv.innerHTML = '<div class="error">请至少填写两个参数才能进行计算</div>';
        return;
    }

    try {
        let result = calculateFIRE(initialAmount, interestRate, years, annualWithdrawal);

        if (!result) {
            errorDiv.innerHTML = '<div class="error">计算失败：未返回结果</div>';
            console.error('calculateFIRE返回null或undefined');
            return;
        }

        if (result.error) {
            errorDiv.innerHTML = `<div class="error">${result.error}</div>`;
            return;
        }

        // 不自动回填输入框：只展示计算结果（避免改变用户输入/留空状态）
        displayResults(result);
    } catch (error) {
        errorDiv.innerHTML = `<div class="error">计算错误：${error.message}<br>请按F12打开控制台查看详细信息</div>`;
        console.error('计算错误:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 统一的FIRE计算函数（不再区分模式）
function calculateFIRE(initialAmount, interestRate, years, annualWithdrawal) {
    const results = [];
    let calculatedInitialAmount = initialAmount;
    let calculatedInterestRate = interestRate;
    let calculatedYears = years || 30; // 默认30年用于展示
    let calculatedAnnualWithdrawal = annualWithdrawal;
    let calculationType = '';

    // 情况1: 已知A和B，计算C（年支出）
    if (initialAmount && interestRate && !annualWithdrawal) {
        // 如果已知年数，可以计算一个合理的年支出
        if (years) {
            // 使用一个保守的年支出：第一年利息收入
            calculatedAnnualWithdrawal = initialAmount * (interestRate / 100);
            calculationType = '已知A、B、D，计算C（年支出，等于第一年利息）';
        } else {
            calculatedAnnualWithdrawal = initialAmount * (interestRate / 100);
            calculationType = '已知A、B，计算C（年支出，等于利息收入）';
        }
    }
    // 情况2: 已知C（年支出）和B，计算A
    else if (!initialAmount && interestRate && annualWithdrawal) {
        // 如果已知年数，需要更复杂的计算
        if (years) {
            // 需要反向计算初始金额，使得n年后余额>=0
            // 使用数值方法求解
            let low = annualWithdrawal / (interestRate / 100);
            let high = annualWithdrawal * years * 2;
            let mid;
            for (let i = 0; i < 100; i++) {
                mid = (low + high) / 2;
                let balance = mid;
                for (let y = 1; y <= years; y++) {
                    balance = balance * (1 + interestRate / 100) - annualWithdrawal;
                }
                if (balance >= 0) {
                    high = mid;
                } else {
                    low = mid;
                }
            }
            calculatedInitialAmount = mid;
            calculatedYears = years;
            calculationType = '已知C（年支出）、B、D，计算A';
        } else {
            calculatedInitialAmount = annualWithdrawal / (interestRate / 100);
            calculationType = '已知C（年支出）、B，计算A';
        }
    }
    // 情况3: 已知A和C（年支出），计算B
    else if (initialAmount && !interestRate && annualWithdrawal) {
        // 使用数值方法求解利率
        let low = 0.001;
        let high = 0.5;
        let mid;
        for (let i = 0; i < 100; i++) {
            mid = (low + high) / 2;
            const firstYearInterest = initialAmount * mid;
            if (firstYearInterest < annualWithdrawal) {
                low = mid;
            } else {
                high = mid;
            }
        }
        calculatedInterestRate = mid * 100;
        calculationType = '已知A、C（年支出），计算B';
    }
    // 情况4: 已知A、B、C（年支出），使用用户设定的年支出
    else if (initialAmount && interestRate && annualWithdrawal) {
        calculatedAnnualWithdrawal = annualWithdrawal;
        if (years) {
            calculationType = '已知A、B、C（年支出）、D，计算验证';
        } else {
            calculationType = '已知A、B、C（年支出），计算验证';
        }
    }
    // 情况5: 已知A、B、D，计算C
    else if (initialAmount && interestRate && years && !annualWithdrawal) {
        // 计算一个合理的年支出：使得n年后余额接近0
        const r = interestRate / 100;
        const pow = Math.pow(1 + r, years);
        // 使用公式：C = A * r * (1+r)^n / ((1+r)^n - 1)
        calculatedAnnualWithdrawal = initialAmount * r * pow / (pow - 1);
        calculatedYears = years;
        calculationType = '已知A、B、D，计算C（年支出，使得D年后余额为0）';
    }
    else {
        return { error: '参数不足：需要至少知道(A和B)或(C和B)或(A和C)或(A、B、D)等参数组合' };
    }

    // 确保所有必需的值都已计算
    if (!calculatedInterestRate || !calculatedInitialAmount || !calculatedAnnualWithdrawal) {
        return { error: '计算错误：无法确定所有必需参数' };
    }
    
    const r = calculatedInterestRate / 100;
    let balance = calculatedInitialAmount;
    
    let totalInterest = 0; // 累计总利息收入
    for (let year = 1; year <= calculatedYears; year++) {
        const initialBalance = balance;
        // 年利息收入不能为负，最少为0（当余额为负或0时，利息为0）
        const interest = Math.max(0, balance * r); // 复利：基于当前余额计算利息，但不能为负
        totalInterest += interest; // 累计总利息
        const withdrawal = calculatedAnnualWithdrawal;
        // 年末余额 = 年初余额 + 利息 - 支出（复利计算）
        // 当年支出大于利息时，自动从本金中消耗
        balance = balance + interest - withdrawal;
        
        results.push({
            year,
            initialBalance,
            interest,
            withdrawal,
            finalBalance: balance
        });
    }

    return {
        type: calculationType,
        initialAmount: calculatedInitialAmount,
        interestRate: calculatedInterestRate,
        years: calculatedYears,
        annualWithdrawal: calculatedAnnualWithdrawal,
        totalInterest: totalInterest, // 总利息收入
        finalAmount: balance, // 最终余额
        results
    };
}

// 保留原函数名以兼容（已废弃）
function calculateInterestOnly(initialAmount, interestRate, years, annualWithdrawal) {
    const results = [];
    let calculatedInitialAmount = initialAmount;
    let calculatedInterestRate = interestRate;
    let calculatedYears = years || 30; // 默认30年用于展示
    let calculatedAnnualWithdrawal = annualWithdrawal;
    let calculationType = '';
    let meta = {
        aProvided: !!initialAmount,
        bProvided: !!interestRate,
        cProvided: !!annualWithdrawal,
        cSource: annualWithdrawal ? 'user' : 'derived',
    };

    // 模式1：只吃利息，年支出 = 初始金额 × 年化利率
    // 本金保持不变

            // 情况1: 已知A和B，计算C（年支出）
            if (initialAmount && interestRate && !annualWithdrawal) {
                calculatedAnnualWithdrawal = initialAmount * (interestRate / 100);
                calculationType = '已知A、B，计算C（年支出）';
                meta = { aProvided: true, bProvided: true, cProvided: false, cSource: 'derived' };
            }
            // 情况2: 已知C（年支出）和B，计算A
            else if (!initialAmount && interestRate && annualWithdrawal) {
                calculatedInitialAmount = annualWithdrawal / (interestRate / 100);
                calculationType = '已知C（年支出）、B，计算A';
                meta = { aProvided: false, bProvided: true, cProvided: true, cSource: 'user' };
            }
            // 情况3: 已知A和C（年支出），计算B
            else if (initialAmount && !interestRate && annualWithdrawal) {
                calculatedInterestRate = (annualWithdrawal / initialAmount) * 100;
                calculationType = '已知A、C（年支出），计算B';
                meta = { aProvided: true, bProvided: false, cProvided: true, cSource: 'user' };
            }
            // 情况4: 已知A、B、C（年支出），使用用户设定的年支出
            else if (initialAmount && interestRate && annualWithdrawal) {
                const expectedWithdrawal = initialAmount * (interestRate / 100);
                calculatedAnnualWithdrawal = annualWithdrawal;
                meta = { aProvided: true, bProvided: true, cProvided: true, cSource: 'user' };
                
                // 检查年支出是否超过利息收入
                if (annualWithdrawal > expectedWithdrawal) {
                    calculationType = '已知A、B、C（年支出），注意：年支出超过利息收入';
                    // 不返回错误，而是继续计算并在结果中提示
                } else if (annualWithdrawal < expectedWithdrawal) {
                    calculationType = '已知A、B、C（年支出），年支出小于利息收入，可长期维持';
                } else {
                    calculationType = '已知A、B、C（年支出），年支出等于利息收入，完美匹配';
                }
            }
            else {
                return { error: '参数不足：模式1需要至少知道(A和B)或(C和B)或(A和C)' };
            }

    const r = calculatedInterestRate / 100;
    let balance = calculatedInitialAmount;
    const expectedWithdrawal = calculatedInitialAmount * r;
    const willConsumePrincipal = calculatedAnnualWithdrawal > expectedWithdrawal;
    
    let totalInterest = 0; // 累计总利息收入
    for (let year = 1; year <= calculatedYears; year++) {
        const initialBalance = balance;
        const interest = balance * r; // 复利：基于当前余额计算利息
        totalInterest += interest; // 累计总利息
        const withdrawal = calculatedAnnualWithdrawal;
        // 年末余额 = 年初余额 + 利息 - 支出（复利计算）
        balance = balance + interest - withdrawal;
        
        results.push({
            year,
            initialBalance,
            interest,
            withdrawal,
            finalBalance: balance
        });
    }

    return {
        type: calculationType,
        initialAmount: calculatedInitialAmount,
        interestRate: calculatedInterestRate,
        years: calculatedYears,
        annualWithdrawal: calculatedAnnualWithdrawal,
        interestIncome: expectedWithdrawal,
        totalInterest: totalInterest, // 总利息收入
        meta,
        results
    };
}

function calculateInterestPlusPrincipal(initialAmount, interestRate, years, annualWithdrawal, principalRatio) {
    const results = [];
    let calculatedInitialAmount = initialAmount;
    let calculatedInterestRate = interestRate;
    let calculatedYears = years;
    let calculatedAnnualWithdrawal = annualWithdrawal;
    let calculatedPrincipalRatio = principalRatio;
    let calculationType = '';

    if (!principalRatio) {
        return { error: '模式2需要填写本金消耗比例 (K)' };
    }

    const r = calculatedInterestRate ? calculatedInterestRate / 100 : null;
    const d = principalRatio / 100;

            // 情况1: 已知A、B、D、K，计算C（年支出）
            if (initialAmount && interestRate && years && !annualWithdrawal) {
                // 正确公式：W = P * r * ((1+r)^n - (1-d)) / ((1+r)^n - 1)
                // 推导：第n年末余额 Pn = P*(1+r)^n - W*((1+r)^n-1)/r = P*(1-d)
                // 解出：W = P * r * ((1+r)^n - (1-d)) / ((1+r)^n - 1)
                const pow = Math.pow(1 + r, years);
                const numerator = initialAmount * r * (pow - (1 - d));
                const denominator = pow - 1;
                calculatedAnnualWithdrawal = numerator / denominator;
                calculatedYears = years;
                calculationType = '已知A、B、D、K，计算C（年支出）';
            }
            // 情况2: 已知C（年支出）、B、D、K，计算A
            else if (!initialAmount && interestRate && years && annualWithdrawal) {
                // 反向计算：从 W = P * r * ((1+r)^n - (1-d)) / ((1+r)^n - 1)
                // 解出：P = W * ((1+r)^n - 1) / (r * ((1+r)^n - (1-d)))
                const pow = Math.pow(1 + r, years);
                const numerator = annualWithdrawal * (pow - 1);
                const denominator = r * (pow - (1 - d));
                calculatedInitialAmount = numerator / denominator;
                calculatedYears = years;
                calculationType = '已知C（年支出）、B、D、K，计算A';
            }
            // 情况3: 已知A、C（年支出）、D、K，计算B（需要数值方法）
            else if (initialAmount && !interestRate && years && annualWithdrawal) {
                // 使用二分法求解利率
                let low = 0.001;
                let high = 0.5;
                let mid;
                let iterations = 0;
                const maxIterations = 100;
                const tolerance = 0.0001;

                while (iterations < maxIterations) {
                    mid = (low + high) / 2;
                    const pow = Math.pow(1 + mid, years);
                    const numerator = initialAmount * mid * (pow - (1 - d));
                    const denominator = pow - 1;
                    const calculatedWithdrawal = numerator / denominator;
                    
                    if (Math.abs(calculatedWithdrawal - annualWithdrawal) < tolerance) {
                        break;
                    }
                    
                    if (calculatedWithdrawal < annualWithdrawal) {
                        low = mid;
                    } else {
                        high = mid;
                    }
                    iterations++;
                }
                
                calculatedInterestRate = mid * 100;
                calculationType = '已知A、C（年支出）、D、K，计算B';
            }
            // 情况4: 已知A、B、C（年支出）、K，计算D（生存年数）
            else if (initialAmount && interestRate && !years && annualWithdrawal) {
                // 需要求解：W = P * r * ((1+r)^n - (1-d)) / ((1+r)^n - 1)
                // 重新整理：W * ((1+r)^n - 1) = P * r * ((1+r)^n - (1-d))
                // W*(1+r)^n - W = P*r*(1+r)^n - P*r*(1-d)
                // (1+r)^n * (W - P*r) = W - P*r*(1-d)
                // (1+r)^n = (W - P*r*(1-d)) / (W - P*r)
                // n = log((W - P*r*(1-d)) / (W - P*r)) / log(1+r)
                
                const numerator = annualWithdrawal - initialAmount * r * (1 - d);
                const denominator = annualWithdrawal - initialAmount * r;
                
                if (denominator <= 0) {
                    return { error: '无法计算：C（年支出）必须大于初始金额×利率' };
                }
                
                const ratio = numerator / denominator;
                if (ratio <= 0 || ratio <= 1) {
                    return { error: '无法计算：参数组合不合理' };
                }
                
                calculatedYears = Math.log(ratio) / Math.log(1 + r);
                calculationType = '已知A、B、C（年支出）、K，计算D（生存年数）';
            }
            // 情况5: 已知A、B、C（年支出）、D、K，使用用户设定的年支出
            else if (initialAmount && interestRate && years && annualWithdrawal) {
                // 使用正确公式计算理论年支出
                const pow = Math.pow(1 + r, years);
                const numerator = initialAmount * r * (pow - (1 - d));
                const denominator = pow - 1;
                const expectedWithdrawal = numerator / denominator;
                
                calculatedAnnualWithdrawal = annualWithdrawal;
                
                // 检查年支出与理论值的差异
                const difference = Math.abs(annualWithdrawal - expectedWithdrawal) / expectedWithdrawal;
                if (difference > 0.01) {
                    if (annualWithdrawal > expectedWithdrawal) {
                        calculationType = '已知A、B、C（年支出）、D、K，注意：年支出高于理论值，可能无法维持D年';
                    } else {
                        calculationType = '已知A、B、C（年支出）、D、K，年支出低于理论值，可维持更长时间';
                    }
                } else {
                    calculationType = '已知A、B、C（年支出）、D、K，年支出与理论值匹配';
                }
            }
            else {
                return { error: '参数不足：模式2需要至少知道(A、B、D、K)或(C、B、D、K)或(A、C、D、K)或(A、B、C、K)' };
            }

    // 生成详细表格
    const finalR = calculatedInterestRate / 100;
    let balance = calculatedInitialAmount;
    const finalAmount = calculatedInitialAmount * (1 - d);
    
    let totalInterest = 0; // 累计总利息收入
    for (let year = 1; year <= calculatedYears; year++) {
        const initialBalance = balance;
        // 年利息收入不能为负，最少为0（当余额为负或0时，利息为0）
        const interest = Math.max(0, balance * finalR); // 复利：基于当前余额计算利息，但不能为负
        totalInterest += interest; // 累计总利息
        const withdrawal = calculatedAnnualWithdrawal;
        // 年末余额 = 年初余额 + 利息 - 支出（复利计算）
        balance = balance + interest - withdrawal;
        
        results.push({
            year,
            initialBalance,
            interest,
            withdrawal,
            finalBalance: balance
        });
    }

    return {
        type: calculationType,
        initialAmount: calculatedInitialAmount,
        interestRate: calculatedInterestRate,
        years: calculatedYears,
        principalRatio: calculatedPrincipalRatio,
        annualWithdrawal: calculatedAnnualWithdrawal,
        finalAmount: balance,
        totalInterest: totalInterest, // 总利息收入
        results
    };
}

function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    
    if (!result || !result.results) {
        resultsDiv.innerHTML = '<div class="error">无法计算：请确保输入了足够的参数</div>';
        return;
    }

    let html = '<div class="results">';
    
    // 检查最终余额是否为负
    if (result.finalAmount < 0) {
        html += `<div style="background: #fff1f2; border: 1px solid #ff8182; padding: 15px; margin-bottom: 20px; border-radius: 6px;">
            <strong style="color: #cf222e;">⚠️ 警告</strong><br>
            <p style="margin: 10px 0 0 0; color: #cf222e;">
                在 ${result.years.toFixed(1)} 年后，余额将为负值（${formatNumber(result.finalAmount)}）。<br>
                年支出过高，无法维持 ${result.years.toFixed(1)} 年。<br>
                <strong>建议：</strong>调整年支出、初始金额、利率或生存年数。
            </p>
        </div>`;
    }
    
    // 结果摘要
    html += '<div class="result-summary">';
    html += `<div class="summary-card">
        <h3>初始金额 (A)</h3>
        <div class="value">${formatNumber(result.initialAmount)}</div>
    </div>`;
    html += `<div class="summary-card">
        <h3>年化利率 (B)</h3>
        <div class="value">${result.interestRate.toFixed(2)}%</div>
    </div>`;
    html += `<div class="summary-card">
        <h3>年支出 (C)</h3>
        <div class="value">${formatNumber(result.annualWithdrawal)}</div>
    </div>`;
    html += `<div class="summary-card">
        <h3>生存年数 (D)</h3>
        <div class="value">${result.years.toFixed(1)}年</div>
    </div>`;
    html += `<div class="summary-card">
        <h3>总利息收入</h3>
        <div class="value">${formatNumber(result.totalInterest || 0)}</div>
    </div>`;
    html += `<div class="summary-card">
        <h3>最终余额</h3>
        <div class="value">${formatNumber(result.finalAmount || 0)}</div>
    </div>`;
    html += '</div>';

    // 计算公式说明
    html += '<div class="formula-section">';
    html += '<h3>📐 计算公式与过程</h3>';
    html += `<div style="margin-bottom: 10px; color: #0969da; font-weight: 500;">${result.type}</div>`;
    
    html += '<div class="formula">';
    html += '<strong>FIRE 复利计算模型</strong><br><br>';
    
    const r = result.interestRate / 100;
    const n = result.years;
    
    // 展示复利递推公式
    html += '<strong>复利递推公式：</strong><br>';
    html += '设第 t 年的年初余额为 P<sub>t</sub>，年化利率为 r，年支出为 C<br>';
    html += '第 t 年的利息收入：I<sub>t</sub> = P<sub>t</sub> × r<br>';
    html += '第 t 年的年末余额：P<sub>t+1</sub> = P<sub>t</sub> + I<sub>t</sub> - C = P<sub>t</sub> × (1 + r) - C<br><br>';
    html += '<strong>说明：</strong>当年支出 C > I<sub>t</sub> 时，自动从本金中消耗；当 C < I<sub>t</sub> 时，未使用的利息会复利增长。<br><br>';
    
    // 展示通项公式推导
    html += '<strong>通项公式推导：</strong><br>';
    html += 'P<sub>1</sub> = A（初始金额）<br>';
    html += 'P<sub>2</sub> = P<sub>1</sub> × (1 + r) - C = A × (1 + r) - C<br>';
    html += 'P<sub>3</sub> = P<sub>2</sub> × (1 + r) - C = A × (1 + r)<sup>2</sup> - C × (1 + r) - C<br>';
    html += 'P<sub>4</sub> = P<sub>3</sub> × (1 + r) - C = A × (1 + r)<sup>3</sup> - C × ((1 + r)<sup>2</sup> + (1 + r) + 1)<br>';
    html += '...<br>';
    html += 'P<sub>n+1</sub> = A × (1 + r)<sup>n</sup> - C × ((1 + r)<sup>n</sup> - 1) / r<br><br>';
    
    html += '<strong>参数代入：</strong><br>';
    html += `A = 初始金额 = ${formatNumber(result.initialAmount)}<br>`;
    html += `r = B = 年化利率 = ${result.interestRate.toFixed(2)}% = ${r.toFixed(4)}<br>`;
    html += `C = 年支出 = ${formatNumber(result.annualWithdrawal)}<br>`;
    html += `n = D = 生存年数 = ${result.years.toFixed(1)}年<br><br>`;
    
    // 第一年分析
    const firstYearInterest = result.initialAmount * r;
    const gap = result.annualWithdrawal - firstYearInterest;
    html += '<strong>第一年分析：</strong><br>';
    html += `I<sub>1</sub> = A × r = ${formatNumber(result.initialAmount)} × ${r.toFixed(4)} = ${formatNumber(firstYearInterest)}<br>`;
    html += `C（年支出）= ${formatNumber(result.annualWithdrawal)}<br>`;
    if (gap > 0) {
        html += `缺口 = C - I<sub>1</sub> = ${formatNumber(gap)}（需要消耗本金）<br><br>`;
        html += '<strong>说明：</strong>年支出大于第一年利息收入，每年将消耗本金，余额逐年减少。';
    } else if (gap < 0) {
        html += `结余 = I<sub>1</sub> - C = ${formatNumber(-gap)}（本金会增长）<br><br>`;
        html += '<strong>说明：</strong>年支出小于利息收入，未使用的利息会复利增长，本金逐年增加。';
    } else {
        html += '结余 = 0（刚好只吃利息）<br><br>';
        html += '<strong>说明：</strong>年支出等于利息收入，本金保持不变（理想情况）。';
    }
    
    // 展示总利息收入和最终余额
    html += '<br><strong>计算结果：</strong><br>';
    html += `总利息收入 = Σ<sub>t=1</sub><sup>${result.years.toFixed(0)}</sup> I<sub>t</sub> = ${formatNumber(result.totalInterest || 0)}<br>`;
    html += `最终余额 = P<sub>${(result.years + 1).toFixed(0)}</sub> = ${formatNumber(result.finalAmount || 0)}<br>`;
    html += '</div>';
    html += '</div>';

    // 详细表格
    html += '<div style="margin-top: 20px;"><strong style="color: #0969da; font-weight: 600;">📊 逐年明细表</strong></div>';
    html += '<div class="table-container">';
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>年份</th>';
    html += '<th>年初余额</th>';
    html += '<th>年利息收入</th>';
    html += '<th>年支出</th>';
    html += '<th>年末余额</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    result.results.forEach(row => {
        html += '<tr>';
        html += `<td>第 ${row.year} 年</td>`;
        html += `<td>${formatNumber(row.initialBalance)}</td>`;
        html += `<td>${formatNumber(row.interest)}</td>`;
        html += `<td>${formatNumber(row.withdrawal)}</td>`;
        html += `<td>${formatNumber(row.finalBalance)}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';
    
    // 添加图表容器
    html += '<div style="margin-top: 30px;"><strong style="color: #0969da; font-weight: 600;">📈 逐年趋势图</strong></div>';
    html += '<div id="chart-container" style="width: 100%; height: 500px; margin-top: 20px;"></div>';
    html += '</div>';

    resultsDiv.innerHTML = html;
    
    // 初始化图表
    setTimeout(() => {
        initChart(result);
    }, 100);
}

function initChart(result) {
    const chartDom = document.getElementById('chart-container');
    if (!chartDom || typeof echarts === 'undefined') {
        console.error('图表容器或ECharts未加载');
        return;
    }
    
    const myChart = echarts.init(chartDom);
    
    const years = result.results.map(r => `第${r.year}年`);
    const initialBalances = result.results.map(r => r.initialBalance);
    const interests = result.results.map(r => r.interest);
    const withdrawals = result.results.map(r => r.withdrawal);
    const finalBalances = result.results.map(r => r.finalBalance);
    
    const option = {
        title: {
            text: 'FIRE计划逐年明细趋势',
            left: 'center',
            textStyle: {
                color: '#24292f',
                fontSize: 18,
                fontWeight: 600
            }
        },
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    result += param.marker + param.seriesName + ': ' + formatNumber(param.value) + '<br/>';
                });
                return result;
            }
        },
        legend: {
            data: ['年初余额', '年利息收入', '年支出', '年末余额'],
            top: 40,
            textStyle: {
                color: '#656d76'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: 80,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: years,
            axisLabel: {
                rotate: 45,
                color: '#656d76'
            },
            axisLine: {
                lineStyle: {
                    color: '#d0d7de'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function(value) {
                    return formatNumber(value);
                },
                color: '#656d76'
            },
            axisLine: {
                lineStyle: {
                    color: '#d0d7de'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#d0d7de'
                }
            }
        },
        series: [
            {
                name: '年初余额',
                type: 'line',
                data: initialBalances,
                smooth: true,
                lineStyle: {
                    color: '#0969da',
                    width: 2
                },
                itemStyle: {
                    color: '#0969da'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0,
                            color: 'rgba(9, 105, 218, 0.2)'
                        }, {
                            offset: 1,
                            color: 'rgba(9, 105, 218, 0.05)'
                        }]
                    }
                }
            },
            {
                name: '年利息收入',
                type: 'bar',
                data: interests,
                itemStyle: {
                    color: '#1a7f37'
                }
            },
            {
                name: '年支出',
                type: 'bar',
                data: withdrawals,
                itemStyle: {
                    color: '#cf222e'
                }
            },
            {
                name: '年末余额',
                type: 'line',
                data: finalBalances,
                smooth: true,
                lineStyle: {
                    color: '#bf8700',
                    width: 2
                },
                itemStyle: {
                    color: '#bf8700'
                }
            }
        ]
    };
    
    myChart.setOption(option);
    
    // 响应式调整
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

function formatNumber(num) {
    return new Intl.NumberFormat('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

// 格式化数字为千分位格式（用于输入框显示，不带小数）
function formatNumberInput(num) {
    if (!num && num !== 0) return '';
    const numStr = num.toString().replace(/,/g, '');
    const numValue = parseFloat(numStr);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('zh-CN', {
        maximumFractionDigits: 0,
        useGrouping: true
    }).format(numValue);
}

// 解析带逗号的数字字符串
function parseNumber(str) {
    if (!str) return null;
    const cleaned = str.toString().replace(/,/g, '').trim();
    if (cleaned === '') return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

