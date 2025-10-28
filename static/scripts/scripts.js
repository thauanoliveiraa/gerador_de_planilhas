
// toggle mobile menu
const btn = document.getElementById('hamburgerBtn');
const mobile = document.getElementById('mobileMenu');
btn && btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
        mobile.style.display = 'block';
    } else {
        mobile.style.display = 'none';
    }
});

// ensure menu state on resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
        mobile.style.display = 'none';
        btn && btn.setAttribute('aria-expanded', 'false');
    }
});

const colunasDiv = document.getElementById('colunas');
const inputsDiv = document.getElementById('inputs');
const cabecalho = document.getElementById('cabecalho');
const tbody = document.querySelector('#tabela tbody');
const previewDiv = document.getElementById('preview');
const nomeArquivoInput = document.getElementById('nomeArquivo');
const colunaSelect = document.getElementById('colunaSelect');
const adicionarDadoForm = document.getElementById('adicionarDadoForm');
const valorDado = document.getElementById('valorDado');

const fileInput = document.getElementById('fileInput');
const previewTxt = document.getElementById('previewTxt');
const previewTxtTable = document.getElementById('previewTxtTable');
const headerLineSelect = document.getElementById('headerLineSelect');
const useHeaderBtn = document.getElementById('useHeaderBtn');
const mappingArea = document.getElementById('mappingArea');
const applyMappingBtn = document.getElementById('applyMappingBtn');
const selectAllTxt = document.getElementById('selectAllTxt');

let colunas = [];
let linhas = [];
let txtRows = [];       // array de arrays com todo o TXT
let txtSelected = [];   // array booleana indicando seleção por linha
let detectedDelimiter = null;

function salvarRascunho() {
    localStorage.setItem('planilhaRascunho', JSON.stringify({ colunas, linhas }));
}
function carregarRascunho() {
    const salvo = localStorage.getItem('planilhaRascunho');
    if (!salvo) return;
    const dados = JSON.parse(salvo);
    colunas = dados.colunas || [];
    linhas = dados.linhas || [];
    if (colunas.length) {
        atualizarListaColunas();
        gerarFormulario();
        document.getElementById('formulario').style.display = 'block';
    }
    if (linhas.length) atualizarTabela();
}
document.getElementById('addColuna').onclick = () => {
    colunas.push({ nome: '', tipo: 'text' });
    atualizarListaColunas();
    gerarFormulario();
    salvarRascunho();
};
function atualizarListaColunas() {
    colunasDiv.innerHTML = '';
    colunas.forEach((col, i) => {
        const div = document.createElement('div');
        div.className = 'coluna-container';
        div.innerHTML = `
      <input placeholder="Nome da coluna" value="${col.nome}" oninput="colunas[${i}].nome=this.value; salvarRascunho();">
      <select onchange="colunas[${i}].tipo=this.value; salvarRascunho();">
        <option value="text" ${col.tipo === 'text' ? 'selected' : ''}>Texto</option>
        <option value="number" ${col.tipo === 'number' ? 'selected' : ''}>Número</option>
        <option value="date" ${col.tipo === 'date' ? 'selected' : ''}>Data</option>
      </select>
      <button class="btn-remover system-action-buttons" onclick="removerColuna(${i})">🗑 Remover coluna</button>`;
        colunasDiv.appendChild(div);
    });
}
function removerColuna(i) {
    if (confirm('Remover esta coluna?')) {
        colunas.splice(i, 1);
        linhas = linhas.map(l => l.filter((_, idx) => idx !== i));
        atualizarListaColunas(); gerarFormulario(); atualizarTabela(); salvarRascunho();
    }
}
document.getElementById('confirmarColunas').onclick = () => {
    if (!colunas.length) return alert('Adicione pelo menos uma coluna');
    gerarFormulario(); salvarRascunho();
};
function gerarFormulario() {
    document.getElementById('formulario').style.display = 'block';
    atualizarFormularioCabecalho();
}
function atualizarFormularioCabecalho() {
    inputsDiv.innerHTML = '';
    colunaSelect.innerHTML = '';
    colunas.forEach(c => {
        const label = document.createElement('label');
        label.textContent = c.nome + ':';
        const input = document.createElement('input');
        input.type = c.tipo; input.id = c.nome;
        inputsDiv.appendChild(label); inputsDiv.appendChild(input);
        const opt = document.createElement('option');
        opt.value = c.nome; opt.textContent = c.nome;
        colunaSelect.appendChild(opt);
    });
    cabecalho.innerHTML = '';
    colunas.forEach((c, idx) => {
        const th = document.createElement('th');
        th.textContent = c.nome || `Coluna ${idx + 1}`;
        th.className = 'editavel';
        th.ondblclick = () => {
            const novoNome = prompt('Novo nome da coluna:', c.nome);
            if (novoNome && novoNome.trim() !== '') {
                c.nome = novoNome.trim();
                salvarRascunho();
                atualizarFormularioCabecalho();
            }
        };
        cabecalho.appendChild(th);
    });
    atualizarTabela();
}
function atualizarTabela() {
    tbody.innerHTML = '';
    linhas.forEach((linha, i) => {
        const tr = document.createElement('tr');
        colunas.forEach((c, idx) => {
            const td = document.createElement('td');
            td.contentEditable = true;
            td.textContent = linha[idx] || '';
            td.addEventListener('input', () => { linhas[i][idx] = td.textContent.trim(); salvarRascunho(); atualizarPreview(); });
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    atualizarPreview();
}
document.getElementById('addLinha').onclick = () => {
    const valores = colunas.map(c => document.getElementById(c.nome)?.value || '');
    if (valores.every(v => v.trim() === '')) return alert('Preencha pelo menos um campo');
    linhas.push(valores);
    atualizarTabela(); salvarRascunho();
    colunas.forEach(c => { const el = document.getElementById(c.nome); if (el) el.value = ''; });
};
document.getElementById('addDado').onclick = () => {
    adicionarDadoForm.style.display = adicionarDadoForm.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('confirmarDado').onclick = () => {
    const colunaNome = colunaSelect.value;
    const valor = valorDado.value.trim();
    if (!colunaNome || !valor) return alert('Preencha o valor');
    const idx = colunas.findIndex(c => c.nome === colunaNome);
    if (idx === -1) return;
    let colocado = false;
    for (let i = 0; i < linhas.length; i++) {
        if (!linhas[i][idx] || linhas[i][idx].trim() === '') {
            linhas[i][idx] = valor;
            colocado = true;
            break;
        }
    }
    if (!colocado) {
        const nova = new Array(colunas.length).fill('');
        nova[idx] = valor;
        linhas.push(nova);
    }
    valorDado.value = '';
    adicionarDadoForm.style.display = 'none';
    atualizarTabela(); salvarRascunho();
};
document.getElementById('salvarEdicoes').onclick = () => { salvarRascunho(); alert('Edições salvas'); };
function atualizarPreview() {
    previewDiv.innerHTML = '';
    if (!colunas.length) return;
    const table = document.createElement('table');
    const trh = document.createElement('tr');
    colunas.forEach(c => { const th = document.createElement('th'); th.textContent = c.nome; trh.appendChild(th); });
    table.appendChild(trh);
    linhas.forEach(l => { const tr = document.createElement('tr'); colunas.forEach((c, idx) => { const td = document.createElement('td'); td.textContent = l[idx] || ''; tr.appendChild(td); }); table.appendChild(tr); });
    previewDiv.appendChild(table);
}
document.getElementById('baixar').onclick = () => {
    if (!linhas.length) return alert('Nenhum dado adicionado');
    const header = colunas.map(c => c.nome);
    const data = [header, ...linhas];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planilha");
    let nome = nomeArquivoInput.value.trim();
    if (!nome.endsWith('.xlsx')) nome += '.xlsx';
    XLSX.writeFile(wb, nome);
};
document.getElementById('limparRascunho').onclick = () => { if (confirm('Apagar rascunho salvo?')) { localStorage.removeItem('planilhaRascunho'); location.reload(); } };
carregarRascunho();

function detectDelimiter(line) {
    const candidates = ['\t', ';', '|', ','];
    let best = null, bestCount = -1;
    candidates.forEach(c => {
        const count = (line.split(c).length - 1);
        if (count > bestCount) { best = c; bestCount = count; }
    });
    return bestCount > 0 ? best : null;
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
        // Excel: importar automaticamente (substitui se confirmado)
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (!json.length) return alert('Planilha vazia');
                if (!confirm('Substituir colunas e dados atuais pelos do Excel importado?')) return;
                colunas = (json[0] || []).map(h => ({ nome: h || '', tipo: 'text' }));
                linhas = json.slice(1).map(r => r.map(c => c === undefined ? '' : String(c)));
                atualizarListaColunas();
                gerarFormulario();
                salvarRascunho();
                alert('Planilha Excel importado com sucesso');
            } catch (err) {
                console.error(err);
                alert('Erro ao ler a planilha Excel');
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (ext === 'txt') {
        const reader = new FileReader();
        reader.onload = (ev) => {
            let text = ev.target.result.replace(/\r/g, '');
            // remover BOM
            text = text.replace(/^\uFEFF/, '');
            let rows = text.split('\n');
            // remover linhas vazias no fim
            while (rows.length && rows[rows.length - 1].trim() === '') rows.pop();
            if (!rows.length) return alert('Documento TXT vazio');
            // detectar delimitador a partir da primeira linha não-vazia
            const firstNonEmpty = rows.find(r => r.trim() !== '') || rows[0];
            const delim = detectDelimiter(firstNonEmpty) || '\t';
            detectedDelimiter = delim;
            txtRows = rows.map(r => r.split(delim).map(cell => cell === undefined ? '' : cell));
            // iniciar seleção: por padrão selecionar todas as linhas
            txtSelected = txtRows.map(() => true);
            renderTxtPreview();
            buildHeaderSelect();
            rebuildMappingArea(); // atualiza área de mapeamento com amostras
            previewTxt.style.display = 'block';
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('Formato de arquivo não suportado. Use *.txt* ou *.xlsx* ');
    }
});

function renderTxtPreview() {
    previewTxtTable.innerHTML = '';
    if (!txtRows.length) return;
    const maxCols = txtRows.reduce((m, r) => Math.max(m, r.length), 0);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // cabeçalho com checkbox select all
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    const thSelect = document.createElement('th'); thSelect.style.width = '40px';
    thSelect.innerHTML = '<input type="checkbox" id="__select_all_rows__" checked>';
    trh.appendChild(thSelect);
    for (let c = 0; c < maxCols; c++) {
        const th = document.createElement('th');
        th.textContent = `Col ${c + 1}`;
        trh.appendChild(th);
    }
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbodyLocal = document.createElement('tbody');
    txtRows.forEach((row, ri) => {
        const tr = document.createElement('tr');
        const tdCheck = document.createElement('td');
        tdCheck.style.textAlign = 'center';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = !!txtSelected[ri];
        chk.dataset.rowIndex = ri;
        chk.addEventListener('change', (ev) => {
            txtSelected[ri] = ev.target.checked;
            // update select all
            const all = txtSelected.every(v => v === true);
            document.getElementById('__select_all_rows__').checked = all;
        });
        tdCheck.appendChild(chk);
        tr.appendChild(tdCheck);

        for (let c = 0; c < maxCols; c++) {
            const td = document.createElement('td');
            td.textContent = row[c] === undefined ? '' : row[c];
            tr.appendChild(td);
        }
        tbodyLocal.appendChild(tr);
    });
    table.appendChild(tbodyLocal);
    previewTxtTable.appendChild(table);

    // hook select all checkbox
    const selectAllCheckbox = document.getElementById('__select_all_rows__');
    selectAllCheckbox.checked = txtSelected.every(v => v === true);
    selectAllCheckbox.addEventListener('change', (ev) => {
        const on = ev.target.checked;
        txtSelected = txtSelected.map(() => on);
        // re-render checkboxes states without redrawing whole table (update DOM)
        previewTxtTable.querySelectorAll('tbody input[type=checkbox]').forEach(chk => chk.checked = on);
    });
}

function buildHeaderSelect() {
    headerLineSelect.innerHTML = '<option value="">(Nenhuma)</option>';
    txtRows.forEach((row, idx) => {
        const text = row.map(cell => String(cell).trim()).join(' | ');
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = (text.length > 100 ? text.slice(0, 100) + '...' : text) || `Linha ${idx + 1}`;
        headerLineSelect.appendChild(option);
    });
}

useHeaderBtn.addEventListener('click', () => {
    const sel = headerLineSelect.value;
    if (sel === '') return alert('Selecione uma linha do TXT para funcionar como nomes das colunas');
    const headerIndex = parseInt(sel, 10);
    const headerRow = txtRows[headerIndex] || [];
    // definir colunas
    colunas = headerRow.map(h => ({ nome: String(h).trim() || 'Coluna', tipo: 'text' }));
    // dados: somente linhas selecionadas e exceto a linha usada como header
    linhas = [];
    txtRows.forEach((r, i) => {
        if (i === headerIndex) return; // pula header
        if (!txtSelected[i]) return;   // só importa linhas marcadas
        const rowArr = new Array(colunas.length).fill('');
        for (let j = 0; j < colunas.length; j++) rowArr[j] = r[j] === undefined ? '' : String(r[j]);
        linhas.push(rowArr);
    });
    atualizarListaColunas();
    gerarFormulario();
    salvarRascunho();
    alert('Colunas definidas a partir da linha selecionada e dados importados (apenas linhas marcadas)');
});

function rebuildMappingArea() {
    mappingArea.innerHTML = '';
    if (!txtRows.length) {
        const p = document.createElement('p');
        p.textContent = 'Carregue um arquivo TXT primeiro para ver amostras.';
        mappingArea.appendChild(p);
        return;
    }

    const maxCols = txtRows.reduce((m, r) => Math.max(m, r.length), 0);

    // mini tabela de amostras do TXT (colunas do TXT como cabeçalho, e primeiras N linhas como amostra)
    const samplesWrapper = document.createElement('div');
    samplesWrapper.style.marginBottom = '10px';
    const sampleTitle = document.createElement('p');
    sampleTitle.style.fontWeight = '600';
    sampleTitle.textContent = 'Amostra das colunas do TXT';
    samplesWrapper.appendChild(sampleTitle);

    const sampleTable = document.createElement('table');
    sampleTable.style.width = '100%';
    sampleTable.style.borderCollapse = 'collapse';

    const trh = document.createElement('tr');
    for (let c = 0; c < maxCols; c++) {
        const th = document.createElement('th');
        th.textContent = `TXT Col ${c + 1}`;
        trh.appendChild(th);
    }
    sampleTable.appendChild(trh);

    const sampleRows = txtRows.slice(0, 6);
    sampleRows.forEach(r => {
        const tr = document.createElement('tr');
        for (let c = 0; c < maxCols; c++) {
            const td = document.createElement('td');
            td.textContent = r[c] === undefined ? '' : r[c];
            tr.appendChild(td);
        }
        sampleTable.appendChild(tr);
    });
    samplesWrapper.appendChild(sampleTable);
    mappingArea.appendChild(samplesWrapper);

    // Para cada coluna da planilha, mostrar mapeamento com select que exibe o TXT column and a mini preview (vertical)
    if (colunas.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'Nenhuma coluna na planilha. Adicione colunas ou use uma linha do TXT como cabeçalho.';
        mappingArea.appendChild(p);
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'map-wrapper';

    colunas.forEach((col, planIdx) => {
        const box = document.createElement('div');
        box.className = 'map-col';
        const h = document.createElement('h5');
        h.textContent = `Planilha: ${col.nome || ('Col ' + (planIdx + 1))}`;
        box.appendChild(h);

        const sel = document.createElement('select');
        sel.dataset.planIdx = planIdx;
        // opção vazio -> ignorar
        const empty = document.createElement('option'); empty.value = ''; empty.textContent = '(Ignorar)';
        sel.appendChild(empty);
        for (let c = 0; c < maxCols; c++) {
            const opt = document.createElement('option');
            // gerar resumo vertical curto para label
            const previewVals = txtRows.slice(0, 5).map(r => r[c] === undefined ? '' : String(r[c]).slice(0, 25));
            opt.value = '' + c;
            opt.textContent = `TXT Col ${c + 1} — ${previewVals.join(' | ')}`;
            sel.appendChild(opt);
        }
        box.appendChild(sel);

        // mini vertical preview: mostrar primeira N valores na coluna TXT
        const mini = document.createElement('div');
        mini.className = 'map-sample';
        const miniTable = document.createElement('table');
        miniTable.style.width = '100%';
        const maxRows = Math.min(txtRows.length, 8);
        for (let r = 0; r < maxRows; r++) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.textContent = txtRows[r][0] === undefined ? '' : ''; // placeholder (will be filled per-col via function)
            tr.appendChild(td);
            miniTable.appendChild(tr);
        }

        const sampleList = document.createElement('div');
        sampleList.style.maxHeight = '120px';
        sampleList.style.overflow = 'auto';
        sampleList.style.paddingTop = '6px';
        sampleList.style.fontSize = '0.95em';
        sampleList.style.lineHeight = '1.4em';

        const info = document.createElement('div');
        info.style.fontSize = '0.85em';
        info.style.color = '#333';
        info.style.marginTop = '6px';
        info.textContent = 'Amostra: selecione um TXT Col para ver valores aqui.';
        box.appendChild(info);

        sel.addEventListener('change', (ev) => {
            const val = ev.target.value;
            if (val === '') {
                info.textContent = 'Amostra: selecionado (Ignorar).';
            } else {
                const cIdx = parseInt(val, 10);
                const rowsToShow = Math.min(txtRows.length, 20);
                const lines = [];
                for (let r = 0; r < rowsToShow; r++) {
                    if (!txtSelected[r]) continue; // only show selected rows in sample
                    const v = txtRows[r][cIdx] === undefined ? '' : String(txtRows[r][cIdx]);
                    lines.push(`${r + 1}: ${v}`);
                }
                info.textContent = lines.length ? lines.join('\n') : '(Não há linhas selecionadas)';
            }
        });

        wrapper.appendChild(box);
        box.appendChild(sel);
    });

    mappingArea.appendChild(wrapper);
}

applyMappingBtn.addEventListener('click', () => {
    if (!txtRows.length) return alert('Nenhum documento TXT carregado');
    if (colunas.length === 0) return alert('Crie/defina colunas na planilha antes de mapear');
    // coletar mapeamento: planIdx -> txtColIdx
    const selects = mappingArea.querySelectorAll('select[data-plan-idx]');
    const map = {};
    selects.forEach(s => {
        const p = parseInt(s.dataset.planIdx, 10);
        if (s.value !== '') map[p] = parseInt(s.value, 10);
    });
    if (Object.keys(map).length === 0) return alert('Nenhum mapeamento definido');
    // percorrer txtRows, só linhas marcadas
    txtRows.forEach((row, ri) => {
        if (!txtSelected[ri]) return; // apenas linhas marcadas
        const nova = new Array(colunas.length).fill('');
        for (const planIdxStr of Object.keys(map)) {
            const planIdx = parseInt(planIdxStr, 10);
            const txtIdx = map[planIdx];
            nova[planIdx] = row[txtIdx] === undefined ? '' : String(row[txtIdx]);
        }
        linhas.push(nova);
    });
    atualizarTabela();
    salvarRascunho();
    alert('Importação por mapeamento concluída (apenas linhas selecionadas do TXT)');
});

/* ====== Tela de carregamento ====== */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader-overlay');
  if (!loader) return;
  // adiciona classe de fade-out
  loader.classList.add('fade-out');
  // remove o elemento após a animação
  setTimeout(() => {
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }, 500); // tempo ligeiramente maior que o transition de 0.6s
});

/* Inicialização */
fileInput.value = '';
previewTxt.style.display = 'none';
carregarRascunho();


