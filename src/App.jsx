import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown,
  Edit3,
  Trash2,
  XCircle,
  CalendarDays,
  Hourglass,
  ListFilter,
  Building2,
  Eye,
  Save,
  PieChart,
  BarChart,
  Target,
  FileText as FileTextIcon,
  File
} from 'lucide-react';
// As bibliotecas Chart.js, jspdf e jspdf-autotable são assumidas como carregadas via CDN no ambiente HTML externo.

// --- Utility: CSV Parser ---
const parseLine = (line) => {
  const row = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let charIndex = 0; charIndex < line.length; charIndex++) {
    const char = line[charIndex];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim().replace(/^"|"$/g, ''));
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  row.push(currentValue.trim().replace(/^"|"$/g, ''));
  return row;
};

const parseCSV = (text) => {
  const allLines = text.split('\n');
  const lines = allLines.filter(line => line.trim() !== '');

  if (lines.length <= 3) return { headers: [], data: [] };

  const HEADER_ROW_INDEX = 3; 
  const DATA_START_INDEX = 4;

  const rawHeaders = parseLine(lines[HEADER_ROW_INDEX]);
  
  const headers = [];
  const headerCounts = {};
  
  rawHeaders.forEach(h => {
    const baseHeader = h.trim() || 'Untitled';
    if (headerCounts[baseHeader]) {
      headers.push(`${baseHeader}_${headerCounts[baseHeader]}`);
      headerCounts[baseHeader]++;
    } else {
      headers.push(baseHeader);
      headerCounts[baseHeader] = 1;
    }
  });
  
  const data = [];
  for (let i = DATA_START_INDEX; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length >= 1) { 
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? row[index] : '';
      });
      obj._id = `row-${i}`;
      
      if (Object.values(obj).some(val => val !== '')) {
         data.push(obj);
      }
    }
  }
  return { headers, data };
};

// --- Components ---

const Card = ({ title, value, icon: Icon, color = "blue", subtext, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md hover:translate-y-[-2px] ${onClick ? 'cursor-pointer' : ''} ${active ? `ring-2 ring-${color}-500 border-${color}-500` : 'border-slate-100'}`}
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subtext && (
        <p className={`text-xs mt-2 font-medium text-slate-400`}>
          {subtext}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
      <Icon size={24} />
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-slate-400">-</span>;
  
  const s = String(status).toUpperCase();
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  let Icon = null;

  if (s.includes('VIGENTE')) {
    colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
    Icon = CheckCircle2;
  } else if (s.includes('VENCIDO')) {
    colorClass = "bg-rose-100 text-rose-700 border-rose-200";
    Icon = XCircle;
  } else if (s.includes('RESCINDIDO')) {
    colorClass = "bg-slate-200 text-slate-700 border-slate-300";
    Icon = AlertTriangle;
  } else {
    Icon = Clock;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit border ${colorClass}`}>
      {Icon && <Icon size={12} />}
      {status}
    </span>
  );
};

const DaysRemainingBadge = ({ days }) => {
  const valNum = parseInt(days);
  if (isNaN(valNum)) return null;

  // Lógica de 30 dias ou menos para o alerta
  if (valNum <= 30 && valNum > 0) {
    return <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><Hourglass size={10}/> {valNum} dias</span>;
  } else if (valNum < 0) {
    return <span className="text-rose-600 font-medium text-xs">Vencido ({Math.abs(valNum)}d)</span>;
  } else {
    return <span className="text-emerald-600 font-medium text-xs">{valNum} dias</span>;
  }
};

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  
  const maxWidthClass = size === "lg" ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClass} overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXh7kM4MOMUvCFR48_6bWI2O1R6NDHxtZd_GLgSZQ37d_tdkENncovOgXBlxY8fD9UmAoP4TRXc8DO/pub?output=csv";
  
  const [contracts, setContracts] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState('dashboard'); // Define dashboard como aba inicial
  const [searchTerm, setSearchTerm] = useState('');
  
  // Iniciando com 'ATIVOS' selecionado
  const [statusFilter, setStatusFilter] = useState('ATIVOS'); 
  const [secretaryFilter, setSecretaryFilter] = useState('TODAS');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isNewContract, setIsNewContract] = useState(false); 
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Falha ao carregar a planilha');
        const text = await response.text();
        const { headers: parsedHeaders, data } = parseCSV(text);
        
        const prettyHeaders = parsedHeaders.map(h => ({
          key: h,
          label: h.toUpperCase()
        }));

        setHeaders(prettyHeaders);
        setContracts(data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function for getting values safely (case insensitive key search)
  const getVal = (item, keyPart) => {
    const key = Object.keys(item).find(k => k.toUpperCase().includes(keyPart));
    return key ? item[key] : '';
  };

  const uniqueSecretaries = useMemo(() => {
    const secs = new Set(contracts.map(c => getVal(c, 'SECRETARIA')).filter(Boolean));
    return ['TODAS', ...Array.from(secs).sort()];
  }, [contracts]);

  // Constante para definir o limite de dias para "A VENCER"
  const EXPIRING_DAYS_LIMIT = 30;

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // 1. Text Search
      const matchesSearch = Object.values(contract).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );

      // 2. Status Filter
      let matchesStatus = true;
      const status = String(getVal(contract, 'SITUAÇÃO')).toUpperCase();
      
      if (statusFilter !== 'TODOS') {
        const days = parseInt(getVal(contract, 'FALTANTES'));
        const isVigente = status.includes('VIGENTE');
        const isAVencer = !isNaN(days) && days > 0 && days <= EXPIRING_DAYS_LIMIT;

        if (statusFilter === 'ATIVOS') {
            matchesStatus = isVigente || isAVencer;
        }
        else if (statusFilter === 'VIGENTE') matchesStatus = isVigente;
        else if (statusFilter === 'VENCIDO') matchesStatus = status.includes('VENCIDO');
        else if (statusFilter === 'RESCINDIDO') matchesStatus = status.includes('RESCINDIDO');
        else if (statusFilter === 'A VENCER') {
             matchesStatus = isAVencer;
        }
      }

      // 3. Secretary Filter
      let matchesSecretary = true;
      if (secretaryFilter !== 'TODAS') {
        const sec = String(getVal(contract, 'SECRETARIA'));
        matchesSecretary = sec === secretaryFilter;
      }

      return matchesSearch && matchesStatus && matchesSecretary;
    });
  }, [contracts, searchTerm, statusFilter, secretaryFilter]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const metrics = useMemo(() => {
    const total = contracts.length;
    const activeCount = contracts.filter(c => 
      String(getVal(c, 'SITUAÇÃO')).toUpperCase().includes('VIGENTE')
    ).length;
    const expiredCount = contracts.filter(c => 
      String(getVal(c, 'SITUAÇÃO')).toUpperCase().includes('VENCIDO')
    ).length;
    const expiringSoonCount = contracts.filter(c => {
      const days = parseInt(getVal(c, 'FALTANTES'));
      return !isNaN(days) && days > 0 && days <= EXPIRING_DAYS_LIMIT;
    }).length;

    // Dados para os gráficos
    const statusCounts = contracts.reduce((acc, contract) => {
        const status = String(getVal(contract, 'SITUAÇÃO')).toUpperCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const secretaryCounts = contracts.reduce((acc, contract) => {
        const sec = String(getVal(contract, 'SECRETARIA'));
        acc[sec] = (acc[sec] || 0) + 1;
        return acc;
    }, {});


    return { total, activeCount, expiredCount, expiringSoonCount, statusCounts, secretaryCounts };
  }, [contracts]);

  // Handler para Salvar (Novo ou Edição)
  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData.entries());
    
    if (isNewContract) {
      // Simulação: Adiciona novo contrato (apenas na memória)
      updates._id = `new-${Date.now()}`;
      setContracts(prev => [updates, ...prev]);
    } else if (selectedContract) {
      // Edição
      setContracts(prev => prev.map(c => 
        c._id === selectedContract._id ? { ...c, ...updates } : c
      ));
    }

    setIsEditModalOpen(false);
    setSelectedContract(null);
    setIsNewContract(false);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este contrato? (Apenas localmente)')) {
      setContracts(prev => prev.filter(c => c._id !== id));
    }
  };

  const openNewContractModal = () => {
    setSelectedContract(null);
    setIsNewContract(true);
    setIsEditModalOpen(true);
  }

  // Seleção de Colunas por Posição Exata (D, E, F, G, I, L)
  const displayHeaders = useMemo(() => {
    // Colunas solicitadas por POSIÇÃO na planilha (D, E, F, G, I, L)
    // D(4), E(5), F(6), G(7), I(9), L(12)
    const targetPositions = [4, 5, 6, 7, 9, 12]; 
    
    // Nomes de cabeçalho limpos para exibição na tabela
    const targetLabels = ['CONTRATO', 'SECRETARIA', 'OBJETO', 'FORNECEDOR', 'VENCIMENTO', 'SITUAÇÃO'];
    
    const foundHeadersInOrder = [];
    
    targetPositions.forEach((pos, index) => {
        const headerIndex = pos - 1;
        const header = headers[headerIndex];
        
        if (header) {
            foundHeadersInOrder.push({
                key: header.key, // Mantém a chave original lida do CSV
                label: targetLabels[index] // Usa o label limpo para a tabela
            });
        }
    });

    return foundHeadersInOrder;
  }, [headers]);

  // Headers para Modais de Edição/Criação (todos os headers que não são auxiliares)
  const editModalHeaders = useMemo(() => {
    // Lista de termos a serem ignorados nas colunas (em qualquer contexto)
    const auxiliaryKeys = ['N°', 'ANO', 'N', 'UNTITLED', 'INÍCIO', 'INICIO', 'DIAS FALTANTES', 'FALTANTES', 'P/ VENCER', 'POSSIBILIDADE DE RENOVAÇÃO', 'OBSERVAÇÃO'];
    
    return headers
      .filter(h => {
        const key = h.key.toUpperCase();
        return !auxiliaryKeys.some(f => key.includes(f));
      });
  }, [headers]);


  const navigateToFilter = (filter) => {
    setStatusFilter(filter);
    setActiveTab('contracts');
    setCurrentPage(1);
  };

  // --- FUNÇÕES DE EXPORTAÇÃO ---
  
  const handleExportCSV = () => {
    const tableHeaders = displayHeaders.map(h => h.label);
    
    // Mapeia os dados da tabela filtrada
    const csvData = filteredContracts.map(contract => {
        return displayHeaders.map(header => {
            let value = contract[header.key];
            if (header.label === 'VENCIMENTO') {
                value = contract[header.key]; 
            } else if (header.label === 'SITUAÇÃO') {
                 value = contract[header.key];
            }
            // Envolve o valor em aspas se contiver vírgulas
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    const csvContent = [tableHeaders.join(','), ...csvData].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'relatorio_contratos_filtrados.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
      // Verifica se a biblioteca jsPDF está disponível globalmente
      if (typeof window.jsPDF === 'undefined' || typeof window.autoTable === 'undefined') {
          alert('As bibliotecas de exportação (jsPDF e jspdf-autotable) não foram encontradas. Para que a exportação funcione, inclua as seguintes tags no HTML externo do seu projeto:\n\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.1/jspdf.plugin.autotable.min.js"></script>');
          return;
      }
      
      const doc = new window.jsPDF({ orientation: 'landscape' });
      
      // Cabeçalho da tabela
      const head = [displayHeaders.map(h => h.label)];
      
      // Corpo da tabela
      const body = filteredContracts.map(contract => {
          return displayHeaders.map(header => {
              const value = contract[header.key];
              const key = header.label.toUpperCase();

              if (key === 'VENCIMENTO') {
                  const diasFaltantes = getVal(contract, 'FALTANTES');
                  return `${value} (${diasFaltantes} dias restantes)`;
              }
              return String(value);
          });
      });

      doc.text("Relatório de Gestão de Contratos", 14, 10);
      doc.setFontSize(10);
      doc.text(`Filtro Ativo: ${statusFilter} | Secretaria: ${secretaryFilter}`, 14, 16);
      doc.setFontSize(12);

      doc.autoTable({
          head: head,
          body: body,
          startY: 20,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] }, // Azul primário do Tailwind
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }
      });

      doc.save('relatorio_contratos_filtrados.pdf');
  };

  // --- FUNÇÕES DE RENDERIZAÇÃO DE GRÁFICOS ---

  const renderStatusChart = () => {
    // Adicionada verificação robusta para evitar erro de destroy em caso de falha no Chart.js
    if (window.statusChart && typeof window.statusChart.destroy === 'function') {
        window.statusChart.destroy();
        window.statusChart = null; 
    }
    if (typeof window.Chart === 'undefined') return; 

    const labels = Object.keys(metrics.statusCounts);
    const dataValues = Object.values(metrics.statusCounts);
    const backgroundColors = labels.map(label => {
        const s = label.toUpperCase();
        if (s.includes('VIGENTE')) return 'rgb(16, 185, 129)'; // emerald-600
        if (s.includes('VENCIDO')) return 'rgb(244, 63, 94)'; // rose-600
        if (s.includes('RESCINDIDO')) return 'rgb(100, 116, 139)'; // slate-500
        return 'rgb(59, 130, 246)'; // blue-500
    });
    
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    window.statusChart = new window.Chart(ctx, { 
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          hoverOffset: 16
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
                usePointStyle: true,
                boxWidth: 8
            }
          },
          title: {
            display: false,
          }
        },
        cutout: '75%', // Transforma em rosca (doughnut)
      }
    });
  };

  const renderSecretaryChart = () => {
    // Adicionada verificação robusta para evitar erro de destroy
    if (window.secretaryChart && typeof window.secretaryChart.destroy === 'function') {
        window.secretaryChart.destroy();
        window.secretaryChart = null; 
    }
    if (typeof window.Chart === 'undefined') return;

    // Top 5 Secretaries
    const sortedSecretaries = Object.entries(metrics.secretaryCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5);

    const labels = sortedSecretaries.map(([name]) => name.substring(0, 20) + (name.length > 20 ? '...' : ''));
    const dataValues = sortedSecretaries.map(([, count]) => count);
    
    const ctx = document.getElementById('secretaryChart');
    if (!ctx) return;

    window.secretaryChart = new window.Chart(ctx, { // Usando window.Chart
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Contratos',
                data: dataValues,
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Azul
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontais
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { beginAtZero: true }
                },
                y: {
                    grid: { display: true, color: '#f1f5f9' } // Cor das linhas horizontais
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false }
            }
        }
    });
  };

  // Renderiza os gráficos quando os dados estiverem prontos e a aba for o dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && !loading && contracts.length > 0) {
      renderStatusChart();
      renderSecretaryChart();
    }
    // Cleanup function para destruir os gráficos ao mudar de aba/componente
    return () => {
        if (window.statusChart && typeof window.statusChart.destroy === 'function') {
            window.statusChart.destroy();
            window.statusChart = null;
        }
        if (window.secretaryChart && typeof window.secretaryChart.destroy === 'function') {
            window.secretaryChart.destroy();
            window.secretaryChart = null;
        }
    };
  }, [activeTab, loading, contracts]);
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Carregando dados...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
        <AlertTriangle size={48} className="text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Erro ao carregar dados</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Tentar Novamente
        </button>
      </div>
    </div>
  );

  const editModalTitle = isNewContract ? 'Novo Contrato' : 'Editar Detalhes';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <aside className="fixed left-0 top-0 h-full w-20 bg-white border-r border-slate-200 hidden md:flex flex-col items-center py-8 gap-8 z-20">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-4">
          <FileText size={20} />
        </div>
        <nav className="flex flex-col gap-4 w-full px-2">
          <button onClick={() => setActiveTab('dashboard')} className={`p-3 rounded-xl transition-all flex justify-center ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title="Dashboard"><LayoutDashboard size={24} /></button>
          <button onClick={() => setActiveTab('contracts')} className={`p-3 rounded-xl transition-all flex justify-center ${activeTab === 'contracts' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`} title="Lista de Contratos"><ListFilter size={24} /></button>
        </nav>
      </aside>

      <main className="md:pl-20 transition-all duration-300">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="2xl font-bold text-slate-800">Gestão de Contratos</h1>
            <p className="text-sm text-slate-500">{activeTab === 'dashboard' ? 'Visão Geral dos Indicadores' : 'Gerenciamento de Registros'}</p>
          </div>
          <div className="flex items-center gap-4">
            
            {/* BOTÕES DE EXPORTAÇÃO */}
            <button 
                onClick={handleExportCSV}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Exportar para CSV"
            >
                <File size={16} /> Exportar CSV
            </button>
             <button 
                onClick={handleExportPDF}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Exportar para PDF"
            >
                <FileTextIcon size={16} /> Exportar PDF
            </button>
            
            {/* Botão Novo Contrato */}
            <button 
              onClick={openNewContractModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:translate-y-[-1px]"
            >
              <Plus size={18} /> Novo Contrato
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-8">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card title="Total de Contratos" value={metrics.total} icon={FileText} color="blue" subtext="Base total cadastrada" onClick={() => navigateToFilter('TODOS')} active={statusFilter === 'TODOS'} />
                <Card title="Contratos Vigentes" value={metrics.activeCount} icon={CheckCircle2} color="emerald" subtext="Contratos ativos" onClick={() => navigateToFilter('VIGENTE')} active={statusFilter === 'VIGENTE'} />
                <Card title={`A Vencer (${EXPIRING_DAYS_LIMIT} dias)`} value={metrics.expiringSoonCount} icon={Hourglass} color="amber" subtext="Clique para ver lista" onClick={() => navigateToFilter('A VENCER')} active={statusFilter === 'A VENCER'} />
                <Card title="Contratos Vencidos" value={metrics.expiredCount} icon={AlertTriangle} color="rose" subtext="Expirados" onClick={() => navigateToFilter('VENCIDO')} active={statusFilter === 'VENCIDO'} />
              </div>

              {/* GRÁFICOS E VISUALIZAÇÕES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  {/* Gráfico 1: Distribuição por Status */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={20} className="text-blue-500" /> Distribuição por Situação</h3>
                      <div className="flex justify-center items-center h-full min-h-[300px]">
                        <canvas id="statusChart" className="w-full h-full"></canvas>
                      </div>
                  </div>

                  {/* Gráfico 2: Contratos por Secretaria */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Building2 size={20} className="text-blue-500" /> Contratos por Secretaria (Top 5)</h3>
                      <div className="flex-1 min-h-[300px] h-full">
                        <canvas id="secretaryChart" className="w-full h-full"></canvas>
                      </div>
                  </div>
              </div>
              
              {/* Seção de Metas (Mock) */}
              <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200">
                 <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Target size={20} className="text-blue-500" /> Metas de Renovação</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-700">95%</p>
                        <p className="text-sm text-emerald-600">Taxa de Contratos Ativos</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="2xl font-bold text-amber-700">{metrics.expiringSoonCount} Contratos</p>
                        <p className="text-sm text-amber-600">A Vencer nos próximos 30 dias</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-2xl font-bold text-slate-700">{metrics.expiredCount}</p>
                        <p className="text-sm text-slate-500">Ações de Encerramento Pendentes</p>
                    </div>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    {/* Botões de Filtro */}
                    {['ATIVOS', 'TODOS', 'A VENCER', 'VENCIDO'].map(status => (
                      <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                         {status === 'ATIVOS' && <CheckCircle2 size={12}/>}
                         {status === 'A VENCER' && <Hourglass size={12}/>}
                         {status === 'VENCIDO' && <XCircle size={12}/>}
                         {status}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[200px]">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={secretaryFilter}
                      onChange={(e) => { setSecretaryFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-8 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer text-slate-600"
                    >
                      {uniqueSecretaries.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
                  <div className="relative flex-1 xl:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar contrato, objeto..." 
                      className="pl-10 pr-4 py-2 text-sm w-full bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-border-blue-500 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"><Filter size={18} /></button>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      {/* Renderiza APENAS as colunas solicitadas */}
                      {displayHeaders.map((header, index) => (
                        <th key={header.key || index} className="px-6 py-4 whitespace-nowrap bg-slate-50 sticky top-0 z-10">
                          <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700">
                            {header.label}
                            <ArrowUpDown size={12} className="opacity-50" />
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right bg-slate-50 sticky top-0 right-0 z-10 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedContracts.length > 0 ? (
                      paginatedContracts.map((contract, index) => (
                        <tr 
                          key={contract._id} 
                          className={`hover:bg-blue-50/30 transition-colors group ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                          {/* Renderiza os dados das colunas solicitadas */}
                          {displayHeaders.map((header, colIndex) => {
                            const value = contract[header.key];
                            const key = header.label.toUpperCase(); 
                            let content = value;

                            if (key.includes('SITUAÇÃO')) {
                              content = <StatusBadge status={value} />;
                            } else if (key.includes('VENCIMENTO')) {
                              const diasFaltantes = getVal(contract, 'FALTANTES');
                              content = (
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-2 font-medium text-slate-700"><CalendarDays size={14} className="text-slate-400 flex-shrink-0"/> {value}</div>
                                  <DaysRemainingBadge days={diasFaltantes} />
                                </div>
                              );
                            } else if (key === 'CONTRATO') {
                               content = <span className="font-bold text-slate-900 text-base">{value}</span>;
                            } else if (key === 'OBJETO' || key === 'FORNECEDOR') {
                                // Adiciona quebra de linha para colunas com texto longo
                                content = <span className="break-words">{value}</span>;
                            }

                            return <td key={header.key || `${contract._id}-${colIndex}`} className="px-6 py-4 text-sm text-slate-600 whitespace-normal min-w-[140px] align-top">{content}</td>;
                          })}
                          <td className={`px-6 py-4 text-right align-top sticky right-0 backdrop-blur-sm shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] ${index % 2 === 0 ? 'bg-white/80' : 'bg-slate-50/80'} group-hover:bg-blue-50/30`}>
                            {/* AÇÕES SEMPRE VISÍVEIS (opacidade 100% constante) */}
                            <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity">
                              <button onClick={() => { setSelectedContract(contract); setIsViewModalOpen(true); }} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Ver Detalhes"><Eye size={16} /></button>
                              <button onClick={() => { setSelectedContract(contract); setIsNewContract(false); setIsEditModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete(contract._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={displayHeaders.length + 1} className="px-6 py-12 text-center text-slate-500"><div className="flex flex-col items-center gap-2"><Search size={32} className="text-slate-300 mb-2" /><p>Nenhum contrato encontrado para o filtro selecionado.</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Paginação com Primeira/Última Página */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <span className="text-sm text-slate-500">
                  Mostrando <span className="font-medium text-slate-900">{paginatedContracts.length}</span> de <span className="font-medium text-slate-900">{filteredContracts.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  
                  {/* Primeira Página */}
                  <button 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Primeira Página"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  
                  {/* Página Anterior */}
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Página Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Páginas Atuais (simplificado) */}
                  <span className="text-sm font-medium text-slate-600">
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  
                  {/* Próxima Página */}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Próxima Página"
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  {/* Última Página */}
                   <button 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                    title="Última Página"
                  >
                    <ChevronsRight size={16} />
                  </button>
                  
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal (usado para Novo Contrato e Edição) */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setIsNewContract(false); }} title={editModalTitle}>
        {/* Renderiza o formulário de edição/criação */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {editModalHeaders
              // Garante que a coluna vazia e a coluna de dias faltantes não apareçam na edição/criação
              .filter(h => !h.key.toUpperCase().includes('UNTITLED') && !h.key.toUpperCase().includes('FALTANTES'))
              .map(header => (
                <div key={header.key} className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{header.label}</label>
                  <input 
                    name={header.key} 
                    // Se for novo contrato, o valor inicial é vazio. Senão, usa o valor do contrato selecionado.
                    defaultValue={selectedContract ? selectedContract[header.key] : ''} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm transition-all" 
                    required={header.key.toUpperCase().includes('CONTRATO') || header.key.toUpperCase().includes('SITUAÇÃO')}
                  />
                </div>
              ))}
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4 bg-white sticky bottom-0">
            <button 
              type="button" 
              onClick={() => { setIsEditModalOpen(false); setIsNewContract(false); }} 
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-colors flex items-center gap-2"
            >
              <Save size={16}/> {isNewContract ? 'Criar Contrato' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalhes do Contrato" size="lg">
        {selectedContract && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
               <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                 <FileText size={24}/>
               </div>
               <div>
                 <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Contrato</p>
                 <h2 className="2xl font-bold text-slate-900">{getVal(selectedContract, 'CONTRATO')}</h2>
               </div>
               <div className="ml-auto">
                 <StatusBadge status={getVal(selectedContract, 'SITUAÇÃO')} />
               </div>
            </div>
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {headers.filter(h => !h.key.toUpperCase().includes('CONTRATO')).map(header => (
                <div key={header.key} className="border-b border-slate-100 pb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{header.label}</p>
                  <p className="text-sm text-slate-800 font-medium break-words leading-relaxed">
                    {selectedContract[header.key] || <span className="text-slate-300 italic">Não informado</span>}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
               <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                 Fechar Visualização
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}