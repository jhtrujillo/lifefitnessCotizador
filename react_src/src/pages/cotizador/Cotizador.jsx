import React, { useState, useEffect } from 'react';
import { getApiUrl, fetchWithAuth, getAuthUser, clearAuth } from '../../utils/api';
import AuthBoundary from '../../components/AuthBoundary';

const fmt = (n) => '$ ' + Math.round(n).toLocaleString('es-CO');
const parseNum = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

export default function Cotizador() {
  const [currentQuoteId, setCurrentQuoteId] = useState(null);
  
  // Products
  const [productsList, setProductsList] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  
  // Clients
  const [clientsList, setClientsList] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSelectedClient, setHasSelectedClient] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  
  // Selected Client
  const [client, setClient] = useState({
    quoteNo: 'Cargando...',
    name: '',
    id: '',
    address: '',
    phone: '',
    email: '',
    adviser: getAuthUser()?.nombre || 'Asesor Fitness Life',
    date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
    validDays: '30 días'
  });

  // New Client Form
  const [newClient, setNewClient] = useState({
    nombre: '',
    identificacion: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  // Cart
  const [items, setItems] = useState([]);

  // Selected Series Filter
  const [selectedSeries, setSelectedSeries] = useState('');

  // Custom Item Form
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Modals / Status
  const [saveModalState, setSaveModalState] = useState('none'); // none, saving, success, error
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [emailModalState, setEmailModalState] = useState('none'); // none, sending, success, error
  const [emailModalMessage, setEmailModalMessage] = useState('');

  // Load draft on mount if no active quote in URL
  useEffect(() => {
    fetchClients();
    fetchProducts();

    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get('id');
    if (quoteId) {
      fetchAndLoadQuote(quoteId);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check if draft exists
      const draftClient = localStorage.getItem('fl_draft_client');
      const draftItems = localStorage.getItem('fl_draft_items');
      const draftSearchQuery = localStorage.getItem('fl_draft_clientSearchQuery');
      const draftHasSelected = localStorage.getItem('fl_draft_hasSelectedClient');
      const draftQuoteId = localStorage.getItem('fl_draft_currentQuoteId');

      if (draftQuoteId) setCurrentQuoteId(JSON.parse(draftQuoteId));
      if (draftClient) setClient(JSON.parse(draftClient));
      if (draftItems) setItems(JSON.parse(draftItems));
      if (draftSearchQuery) setClientSearchQuery(draftSearchQuery);
      if (draftHasSelected) setHasSelectedClient(JSON.parse(draftHasSelected));

      // Fetch quote number if not already defined or if it is 'Cargando...'
      const parsedClient = draftClient ? JSON.parse(draftClient) : {};
      if (!parsedClient.quoteNo || parsedClient.quoteNo === 'Cargando...') {
        fetchNextQuoteNo();
      }
    }
  }, []);

  // Save draft whenever changes occur (only if it's a new quote in progress)
  useEffect(() => {
    if (currentQuoteId === null) {
      if (items.length > 0 || client.name || clientSearchQuery) {
        localStorage.setItem('fl_draft_client', JSON.stringify(client));
        localStorage.setItem('fl_draft_items', JSON.stringify(items));
        localStorage.setItem('fl_draft_clientSearchQuery', clientSearchQuery);
        localStorage.setItem('fl_draft_hasSelectedClient', JSON.stringify(hasSelectedClient));
        localStorage.setItem('fl_draft_currentQuoteId', JSON.stringify(currentQuoteId));
      }
    }
  }, [client, items, clientSearchQuery, hasSelectedClient, currentQuoteId]);

  const clearDraft = () => {
    localStorage.removeItem('fl_draft_client');
    localStorage.removeItem('fl_draft_items');
    localStorage.removeItem('fl_draft_clientSearchQuery');
    localStorage.removeItem('fl_draft_hasSelectedClient');
    localStorage.removeItem('fl_draft_currentQuoteId');
  };

  const fetchNextQuoteNo = () => {
    fetchWithAuth('get_next_quote_no')
      .then(data => {
        if (data.success && data.quote_no) {
          setClient(prev => ({ ...prev, quoteNo: data.quote_no }));
        }
      })
      .catch(err => console.error('Error fetching quote no:', err));
  };

  const fetchProducts = () => {
    setIsLoadingProducts(true);
    fetchWithAuth('get_products')
      .then(data => {
        if (data.success) {
          const mapped = data.productos.map(p => ({
            id: p.id,
            name: `${p.item_no} - ${p.name}`,
            brand: 'Realleader',
            series: p.series,
            desc: `Series: ${p.series} | Set-Up: ${p.set_up_dimension || 'N/A'} | N.W: ${p.nw || 'N/A'}`,
            price: parseFloat(p.price) || 0,
            img: p.img || '',
            categoryName: p.series
          }));
          setProductsList(mapped);
        }
        setIsLoadingProducts(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingProducts(false);
      });
  };

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event('auth_failed'));
  };

  const fetchClients = () => {
    fetchWithAuth('get_clients')
      .then(data => {
        if (data.success) {
          setClientsList(data.clients || []);
        }
      })
      .catch(err => console.error(err));
  };

  const fetchAndLoadQuote = (id) => {
    fetchWithAuth('get_quotes')
      .then(data => {
        if (data.success) {
          const q = (data.quotes || []).find(x => String(x.id) === String(id));
          if (q) {
            // Parse cliente_json
            let clientData = q.cliente_json || {};
            if (typeof clientData === 'string') {
              try { clientData = JSON.parse(clientData); } catch (e) {}
            }

            // Parse items_json
            let itemsData = q.items_json || [];
            if (typeof itemsData === 'string') {
              try { itemsData = JSON.parse(itemsData); } catch (e) {}
            }

            setCurrentQuoteId(q.id);
            setClient(clientData);
            setItems(itemsData);
            setClientSearchQuery(clientData.name || '');
            setHasSelectedClient(!!clientData.name);
          }
        }
      })
      .catch(err => console.error(err));
  };

  const startNewQuote = () => {
    clearDraft();
    setCurrentQuoteId(null);
    setItems([]);
    setClientSearchQuery('');
    setHasSelectedClient(false);
    setClient({
      quoteNo: 'Cargando...',
      name: '',
      id: '',
      address: '',
      phone: '',
      email: '',
      adviser: getAuthUser()?.nombre || 'Asesor Fitness Life',
      date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      validDays: '30 días'
    });
    fetchNextQuoteNo();
  };

  const saveQuote = () => {
    if (!client.name || !client.id) {
      alert("Por favor, selecciona o registra la información del cliente antes de guardar.");
      return;
    }
    if (items.length === 0) {
      alert("Debes tener al menos un producto seleccionado para guardar la cotización.");
      return;
    }

    const subtotalNum = items.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.price || 0)), 0);
    const iva = subtotalNum * 0.19;
    const total = subtotalNum + iva;

    const payload = {
      id: currentQuoteId,
      quote_no: client.quoteNo,
      cliente_json: client,
      items_json: items,
      subtotal: subtotalNum,
      iva: iva,
      total: total
    };

    setSaveModalState('saving');
    setSaveModalMessage('');

    fetchWithAuth('save_quote', {
      method: 'POST',
      body: payload
    })
      .then(data => {
        if (data.success) {
          clearDraft();
          setCurrentQuoteId(data.id);
          setSaveModalState('success');
          setSaveModalMessage('La cotización se guardó exitosamente en la base de datos.');
        } else {
          setSaveModalState('error');
          setSaveModalMessage(data.error || 'Error desconocido.');
        }
      })
      .catch(err => {
        console.error(err);
        setSaveModalState('error');
        setSaveModalMessage('Error de red al guardar la cotización.');
      });
  };

  // Márgenes reservados por página (pulgadas): [arriba, izq, abajo, der].
  // El de arriba reserva el encabezado y el de abajo el pie que dibujamos.
  const PDF_MARGIN = [1.05, 0.5, 0.7, 0.5];

  // Convierte una imagen (el logo) en dataURL para incrustarla en el PDF.
  const getImageData = (src) => new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve({ data: c.toDataURL('image/png'), ratio: img.naturalWidth / img.naturalHeight });
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch (e) { resolve(null); }
  });

  // Dibuja el encabezado y el pie sobre UNA página del PDF (se llama por cada página).
  const drawHeaderFooter = (pdf, logo, pageNum, pageCount) => {
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const mL = 0.4, mR = pw - 0.4;

    // --- Encabezado ---
    if (logo && logo.data) {
      const h = 0.5, w = h * (logo.ratio || 2.6);
      try { pdf.addImage(logo.data, 'PNG', mL, 0.33, w, h); } catch (e) {}
    }
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(45, 45, 45); pdf.setFontSize(19);
    pdf.text('COTIZACIÓN', mR, 0.56, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(114, 114, 114); pdf.setFontSize(8);
    pdf.text(`N.º ${client.quoteNo || ''}    ${client.date || ''}    Válida ${client.validDays || ''}`, mR, 0.74, { align: 'right' });
    pdf.setDrawColor(230, 57, 70); pdf.setLineWidth(0.028);
    pdf.line(mL, 0.9, mR, 0.9);

    // --- Pie ---
    pdf.setDrawColor(216, 216, 216); pdf.setLineWidth(0.008);
    pdf.line(mL, ph - 0.5, mR, ph - 0.5);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(127, 127, 127); pdf.setFontSize(7);
    pdf.text('FITNESS LIFE S.A.S - Importador Directo Autorizado en Colombia', mL, ph - 0.35, { align: 'left' });
    pdf.text('ventas@fitnesslifesas.com    +57 (1) 555-0100', mR, ph - 0.35, { align: 'right' });
    pdf.setFontSize(6.5);
    pdf.text(`Página ${pageNum} de ${pageCount}`, pw / 2, ph - 0.25, { align: 'center' });
  };

  // Espera a que las imágenes de un nodo terminen de cargar (con tope de tiempo).
  const waitForImages = (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img => (img.complete && img.naturalWidth > 0)
      ? Promise.resolve()
      : new Promise(res => { img.onload = res; img.onerror = res; })
    )).catch(() => {});
  };

  // Construye un CLON limpio con SOLO el contenido del cuerpo (sin el marco de tabla
  // ni encabezados/pies ocultos). Así html2canvas no reserva espacio fantasma que
  // dejaba huecos en el PDF. El encabezado/pie los dibuja jsPDF por página.
  const buildCleanNode = () => {
    const container = document.querySelector('.print-container');
    const cell = container ? container.querySelector('.pdf-frame > tbody > tr > td') : null;
    const sourceHTML = cell ? cell.innerHTML : (container ? container.innerHTML : '');

    const holder = document.createElement('div');
    holder.style.cssText = 'position:absolute; left:0; top:0; z-index:-9999; visibility: hidden; width: 720px; text-align: left; overflow: hidden;';
    const node = document.createElement('div');
    node.className = 'print-container pdf-doc';
    node.style.cssText = 'padding:0; margin:0; max-width:none; width:720px; background:#ffffff; text-align: left; transform: none !important; left: 0; position: relative;';
    node.innerHTML = sourceHTML;
    // Quitar del clon lo que dibujamos con jsPDF o que no debe ir en el cuerpo.
    node.querySelectorAll('.doc-head, .quote-footer, .pdf-running-header, .pdf-running-footer')
      .forEach(n => n.remove());

    holder.appendChild(node);
    document.body.appendChild(holder);
    return { node, cleanup: () => { try { document.body.removeChild(holder); } catch (e) {} } };
  };

  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) return resolve(window.html2pdf);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve(window.html2pdf);
      script.onerror = () => reject(new Error("Failed to load html2pdf"));
      document.body.appendChild(script);
    });
  };

  // Construye el jsPDF completo (contenido limpio + encabezado/pie en cada página).
  const buildPdf = () => {
    const { node, cleanup } = buildCleanNode();
    const opt = {
      margin:      [1.05, 0.4, 0.7, 0.4],
      filename:    `Cotizacion_${client.quoteNo || '1'}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, windowWidth: 720 },
      jsPDF:       { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:   { mode: ['css', 'legacy'] }
    };
    return Promise.all([getImageData('assets/logo.png'), waitForImages(node), document.fonts.ready])
      .then(([logo]) =>
        window.html2pdf().set(opt).from(node).toPdf().get('pdf').then(pdf => {
          const n = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= n; i++) { pdf.setPage(i); drawHeaderFooter(pdf, logo, i, n); }
          cleanup();
          return { pdf, filename: opt.filename };
        })
      )
      .catch(err => { cleanup(); throw err; });
  };

  // Usado por el envío por correo / WhatsApp: devuelve un File con el PDF.
  const generatePdfFile = async () => {
    await loadHtml2Pdf();
    if (!window.html2pdf) {
      return Promise.reject(new Error("La librería html2pdf no se pudo cargar. Revisa tu conexión a internet."));
    }
    return buildPdf().then(({ pdf, filename }) => {
      const blob = pdf.output('blob');
      return new File([blob], filename, { type: 'application/pdf' });
    });
  };

  // Botón "Descargar PDF": genera y descarga el archivo directamente (sin diálogo de impresión).
  const downloadPdf = async () => {
    await loadHtml2Pdf();
    if (!window.html2pdf) {
      alert("No se pudo cargar el generador de PDF. Revisa tu conexión a internet.");
      return;
    }
    buildPdf()
      .then(({ pdf, filename }) => { pdf.save(filename); })
      .catch(err => { console.error(err); alert("Ocurrió un error al generar el PDF."); });
  };

  const generateMessageBody = (isNativeShare = false) => {
    const subtotalNum = items.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.price || 0)), 0);
    const total = fmt(subtotalNum * 1.19);

    let msg = `Hola ${client.name || ''},\n\n`;
    if (isNativeShare) {
      msg += `Te compartimos los detalles de tu cotización ${client.quoteNo} en formato PDF (archivo adjunto en este mensaje):\n\n`;
    } else {
      msg += `Te compartimos los detalles de tu cotización ${client.quoteNo}:\n\n`;
    }

    items.forEach(it => {
      msg += `- ${it.qty}x ${it.name}\n`;
    });

    msg += `\n*TOTAL: ${total}*\n\n`;
    msg += `Quedamos a tu entera disposición si tienes alguna duda.\n`;
    msg += `Asesor: ${client.adviser}\nFitness Life S.A.S`;

    return msg;
  };

  const sendWhatsApp = async () => {
    if (!client.phone) {
      alert("Por favor asegúrate de seleccionar un cliente con número de teléfono registrado.");
      return;
    }
    const phone = client.phone.replace(/[^0-9]/g, '');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        const file = await generatePdfFile();
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Cotización ${client.quoteNo}`,
            text: generateMessageBody(true)
          });
        } else {
          const msg = encodeURIComponent(generateMessageBody(false));
          window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
        }
      } catch (e) {
        console.error(e);
        const msg = encodeURIComponent(generateMessageBody(false));
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      }
    } else {
      const msg = encodeURIComponent(generateMessageBody(false));
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };

  const sendEmail = async () => {
    if (!client.name || !client.id) {
      alert("Por favor, selecciona o registra la información del cliente antes de enviar el correo.");
      return;
    }
    if (items.length === 0) {
      alert("Debes tener al menos un producto seleccionado para enviar la cotización por correo.");
      return;
    }
    if (!client.email) {
      alert("Por favor asegúrate de seleccionar un cliente con correo electrónico registrado.");
      return;
    }

    setEmailModalState('sending');
    setEmailModalMessage('');
    const originalScroll = window.scrollY;
    window.scrollTo(0, 0);

    setTimeout(async () => {
      try {
        const file = await generatePdfFile();
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result;
          
          try {
            const response = await fetchWithAuth('send_email', {
              method: 'POST',
              body: {
                to: client.email,
                subject: `Cotización ${client.quoteNo} - Fitness Life`,
                body: generateMessageBody(false),
                pdf: base64data,
                filename: file.name
              }
            });
            
            const result = response;
            if (result.success) {
              setEmailModalState('success');
              setEmailModalMessage("El correo fue enviado exitosamente a: " + client.email);
            } else {
              setEmailModalState('error');
              setEmailModalMessage(result.error || "El servidor rechazó el envío.");
            }
          } catch(e) {
            console.error(e);
            setEmailModalState('error');
            setEmailModalMessage("Hubo un problema de conexión con el servidor.");
          } finally {
            window.scrollTo(0, originalScroll);
          }
        };
        
        reader.onerror = () => {
          setEmailModalState('error');
          setEmailModalMessage("Error interno al leer el PDF.");
          window.scrollTo(0, originalScroll);
        };
      } catch (e) {
        console.error(e);
        setEmailModalState('error');
        setEmailModalMessage("Error al generar el PDF: " + (e.message || e));
        window.scrollTo(0, originalScroll);
      }
    }, 500);
  };

  const selectProduct = (prod) => {
    const newItems = [...items];
    const existing = newItems.find(it => it.name === prod.name);
    
    if (existing) {
      existing.qty = parseInt(existing.qty) + 1;
    } else {
      newItems.push({
        id: 'p-' + Date.now(),
        name: prod.name,
        desc: prod.desc,
        qty: 1,
        price: prod.price,
        img: prod.img
      });
    }
    
    setItems(newItems);
    setProductSearchQuery('');
    setShowProductSuggestions(false);
  };

  const createClientFromQuery = () => {
    setNewClient({ nombre: clientSearchQuery, identificacion: "", email: "", telefono: "", ciudad: "" });
    setIsCreatingClient(true);
    setShowSuggestions(false);
  };

  const saveClientToDb = () => {
    if (!newClient.nombre.trim() || !newClient.identificacion.trim()) {
      alert("El nombre y la identificación (NIT/CC) son obligatorios.");
      return;
    }

    fetchWithAuth('create_client', {
      method: 'POST',
      body: newClient
    })
      .then(data => {
        if (data.success) {
          setClient(prev => ({
            ...prev,
            name: data.client.nombre,
            id: data.client.identificacion,
            address: data.client.direccion,
            phone: data.client.telefono,
            email: data.client.email
          }));
          setClientSearchQuery(data.client.nombre);
          setHasSelectedClient(true);
          setIsCreatingClient(false);
          setShowSuggestions(false);
          setNewClient({ nombre: '', identificacion: '', direccion: '', telefono: '', email: '' });
          fetchClients();
        } else {
          alert("Error: " + data.error);
        }
      })
      .catch(err => {
        console.error("Error al guardar cliente:", err);
        alert("Ocurrió un error al intentar guardar el cliente.");
      });
  };

  const selectClient = (c) => {
    setClientSearchQuery(c.nombre);
    setHasSelectedClient(true);
    setShowSuggestions(false);
    setClient(prev => ({
      ...prev,
      name: c.nombre,
      id: c.identificacion,
      address: c.direccion,
      phone: c.telefono,
      email: c.email
    }));
  };

  const clearClientSelection = () => {
    setClientSearchQuery('');
    setHasSelectedClient(false);
    setShowSuggestions(false);
    setClient(prev => ({
      ...prev,
      name: '',
      id: '',
      address: '',
      phone: '',
      email: ''
    }));
  };

  const handleUpdateItem = (index, key, val) => {
    const newItems = [...items];
    if (key === 'qty' || key === 'price') {
      val = parseFloat(val) || 0;
    }
    newItems[index] = { ...newItems[index], [key]: val };
    setItems(newItems);
  };

  const removeFromCart = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const addCustomRow = () => {
    if (!customName.trim()) return;
    
    const price = parseNum(customPrice) || 0;
    const qty = parseInt(customQty) || 1;
    
    const newItems = [...items, {
      id: 'custom-' + Date.now(),
      name: customName,
      desc: 'Equipo personalizado y configurado.',
      qty,
      price,
      img: 'assets/cat_pesas.jpg'
    }];
    
    setItems(newItems);
    setCustomName('');
    setCustomPrice('');
    setCustomQty('1');
  };

  // Computations
  const subtotalNum = items.reduce((acc, it) => acc + ((it.qty || 0) * (it.price || 0)), 0);
  const ivaNum = subtotalNum * 0.19;
  const totalNum = subtotalNum + ivaNum;

  // Filtered Products
  const seriesOptions = Array.from(new Set(productsList.map(p => p.series).filter(Boolean)));
  const pQuery = productSearchQuery.toLowerCase().trim();
  const filteredProducts = productsList.filter(p => {
    const matchesQuery = pQuery.length === 0 || (p.name || "").toString().toLowerCase().includes(pQuery) || (p.series && p.series.toLowerCase().includes(pQuery));
    const matchesSeries = !selectedSeries || p.series === selectedSeries;
    return matchesQuery && matchesSeries;
  });

  // Filtered Clients
  const cQuery = clientSearchQuery.toLowerCase().trim();
  const filteredClients = cQuery.length === 0 
    ? clientsList 
    : clientsList.filter(c => (c.nombre || "").toString().toLowerCase().includes(cQuery) || (c.identificacion || "").toString().toLowerCase().includes(cQuery));

  return (
    <AuthBoundary>
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Email Modal */}
      {emailModalState !== 'none' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 100 + '%', height: 100 + '%', background: 'rgba(29, 53, 87, 0.95)', zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ width: 100 + '%', maxWidth: 450 + 'px', padding: 24 + 'px', textAlign: 'center' }}>
            {emailModalState === 'sending' && (
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><div className="loading-spinner"></div></div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>Enviando cotización</h3>
                <p style={{ margin: 0, color: '#a8dadc', fontSize: 14 + 'px' }}>Generando PDF y conectando con el servidor técnico...</p>
              </div>
            )}
            
            {emailModalState === 'success' && (
              <div>
                <div style={{ fontSize: 40 + 'px', marginBottom: 16 + 'px', color: '#4ad66d' }}>✓</div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>¡Correo Enviado!</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14 + 'px' }}>{emailModalMessage}</p>
                <button onClick={() => setEmailModalState('none')} style={{ background: 'white', color: '#1d3557', border: 'none', padding: '10px 24px', borderRadius: 4 + 'px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Cerrar Ventana</button>
              </div>
            )}

            {emailModalState === 'error' && (
              <div>
                <div style={{ fontSize: 40 + 'px', marginBottom: 16 + 'px', color: '#e63946' }}>⚠️</div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>Error en el envío</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14 + 'px', color: '#ffb3b3' }}>{emailModalMessage}</p>
                <button onClick={() => setEmailModalState('none')} style={{ background: 'white', color: '#e63946', border: 'none', padding: '10px 24px', borderRadius: 4 + 'px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Reintentar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalState !== 'none' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: 100 + '%', height: 100 + '%', background: 'rgba(29, 53, 87, 0.95)', zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ width: 100 + '%', maxWidth: 450 + 'px', padding: 24 + 'px', textAlign: 'center' }}>
            {saveModalState === 'saving' && (
              <div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}><div className="loading-spinner"></div></div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>Guardando cotización</h3>
                <p style={{ margin: 0, color: '#a8dadc', fontSize: 14 + 'px' }}>Escribiendo registros en la base de datos de Fitness Life...</p>
              </div>
            )}
            
            {saveModalState === 'success' && (
              <div>
                <div style={{ fontSize: 40 + 'px', marginBottom: 16 + 'px', color: '#4ad66d' }}>✓</div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>¡Guardado Exitoso!</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14 + 'px' }}>{saveModalMessage}</p>
                <button onClick={() => setSaveModalState('none')} style={{ background: 'white', color: '#1d3557', border: 'none', padding: '10px 24px', borderRadius: 4 + 'px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Listo</button>
              </div>
            )}

            {saveModalState === 'error' && (
              <div>
                <div style={{ fontSize: 40 + 'px', marginBottom: 16 + 'px', color: '#e63946' }}>⚠️</div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', margin: '0 0 8px' }}>Error al guardar</h3>
                <p style={{ margin: '0 0 24px', fontSize: 14 + 'px', color: '#ffb3b3' }}>{saveModalMessage}</p>
                <button onClick={() => setSaveModalState('none')} style={{ background: 'white', color: '#e63946', border: 'none', padding: '10px 24px', borderRadius: 4 + 'px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase' }}>Reintentar</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="no-print">
        {/* Encabezado Premium */}
                    <header className="app-header" style={{ background: '#1d3557', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="assets/logo.png" alt="Fitness Life S.A.S" style={{ height: '50px', width: 'auto', background: 'white', padding: '4px', borderRadius: '4px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cotizador Premium</h1>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={startNewQuote} style={{ background: '#457b9d', color: 'white', border: 'none', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}><span style={{fontSize:"16px", marginBottom:"4px"}}>✨</span><span>Nueva Cotización</span></button>
          <a href="mis_cotizaciones.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>📂</span><span>Historial</span>
          </a>
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_productos.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>📦</span><span>Productos</span>
            </a>
          )}
          {getAuthUser()?.rol === 'admin' && (
            <a href="admin_usuarios.html" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column', textDecoration: 'none' }}>
              <span style={{fontSize:"16px", marginBottom:"4px"}}>👥</span><span>Usuarios</span>
            </a>
          )}
          <button onClick={handleLogout} style={{ background: '#e63946', color: 'white', border: 'none', padding: '10px 4px', boxSizing: 'border-box', fontWeight: 600, fontSize: '11px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexDirection: 'column' }}>
            <span style={{fontSize:"16px", marginBottom:"4px"}}>🚪</span><span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

        {/* Layout en Pantalla */}
        <div className="screen-layout">
          {/* Columna Izquierda: Editor */}
          <div>
            {/* Buscador de Equipos */}
            <div className="panel-card" style={{ marginBottom: '24px', position: 'relative' }}>
              <h3 style={{ margin: '0 0 16px', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557', fontSize: '16px' }}>🔍 Buscar y Añadir Equipos del Catálogo</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexGrow: 1, minWidth: '240px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', background: '#f7f7f7', border: '1px solid #d8d8d8', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: '18px', color: '#999999' }}>🔍</span>
                  <input 
                    value={productSearchQuery} 
                    onChange={(e) => setProductSearchQuery(e.target.value)} 
                    onFocus={() => setShowProductSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                    placeholder="Buscar equipo por nombre o marca..." 
                    style={{ width: '100%', boxSizing: 'border-box', background: 'white', border: '1px solid #d8d8d8', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '10px 10px 10px 0', fontSize: '13px', fontWeight: 600, color: '#333333', cursor: 'text' }}
                  />
                </div>
                <select
                  value={selectedSeries}
                  onChange={(e) => {
                    setSelectedSeries(e.target.value);
                    setShowProductSuggestions(true);
                  }}
                  style={{ background: '#f7f7f7', border: '1px solid #d8d8d8', borderRadius: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#333333', cursor: 'pointer', height: '41px', minWidth: '160px' }}
                >
                  <option value="">Todas las series</option>
                  {seriesOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {showProductSuggestions && (
                <div style={{ position: 'absolute', top: '100%', left: 24 + 'px', right: 24 + 'px', marginTop: '8px', background: 'white', border: '1px solid #d8d8d8', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 999, maxHeight: '350px', overflowY: 'auto' }}>
                  {isLoadingProducts ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                      <span className="loading-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #ccc', borderTopColor: '#e63946', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px', verticalAlign: 'middle' }}></span>
                      Cargando productos...
                    </div>
                  ) : (
                    <>
                      {filteredProducts.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => selectProduct(p)} 
                          style={{ padding: '12px 16px', borderBottom: '1px solid #f2f2f2', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <img src={p.img || 'assets/cat_pesas.jpg'} style={{ width: '48px', height: '36px', objectFit: 'contain', background: '#fafafa', border: '1px solid #eee', borderRadius: '4px' }} alt="" />
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#2d2d2d' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{p.desc}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#e63946', fontSize: '13px' }}>{fmt(p.price)}</div>
                        </div>
                      ))}
                      {pQuery.length > 0 && filteredProducts.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No se encontraron productos con esa búsqueda.</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Editor de la Tabla */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e63946', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557', fontSize: '18px' }}>🛒 Equipos Cotizados</h3>
                <span style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{items.length} items</span>
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#999999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛒</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>El carrito está vacío</div>
                  <p style={{ margin: 0, fontSize: '12px' }}>Busca equipos arriba para agregarlos a la cotización.</p>
                </div>
              ) : (
                <table className="editor-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eaeaea', textAlign: 'left', color: '#888888', fontWeight: 600 }}>
                      <th style={{ padding: '10px', width: '50px' }}>Imagen</th>
                      <th style={{ padding: '10px' }}>Nombre & Descripción del Equipo</th>
                      <th style={{ padding: '10px', width: '70px', textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: '10px', width: '120px', textAlign: 'right' }}>Precio Unit. (COP)</th>
                      <th style={{ padding: '10px', width: '120px', textAlign: 'right' }}>Total (COP)</th>
                      <th style={{ padding: '10px', width: '50px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                        <td className="img-cell" style={{ padding: '10px', verticalAlign: 'middle', textAlign: 'center' }}>
                          <img src={item.img || 'assets/cat_pesas.jpg'} alt="" style={{ width: '50px', height: '40px', objectFit: 'contain', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: '4px' }} />
                        </td>
                        <td className="desc-cell" style={{ padding: '10px', verticalAlign: 'top' }}>
                          <input value={item.name} onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)} style={{ fontWeight: 600, color: '#262626', width: '100%', background: '#f9f9f9', borderBottom: '1px solid transparent', padding: '4px' }} placeholder="Nombre del equipo" />
                          <textarea value={item.desc} onChange={(e) => handleUpdateItem(idx, 'desc', e.target.value)} rows="2" style={{ fontSize: '11px', color: '#7f7f7f', width: '100%', resize: 'none', marginTop: '4px', background: '#f9f9f9', padding: '4px', border: '1px solid transparent', borderRadius: '4px' }} placeholder="Descripción..."></textarea>
                        </td>
                        <td data-label="Cant." style={{ padding: '10px', verticalAlign: 'top', textAlign: 'center' }}>
                          <input type="text" inputMode="numeric" pattern="[0-9]*" value={item.qty} onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)} style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '6px', fontWeight: 600 }} />
                        </td>
                        <td data-label="Vr. Unitario" style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                            <span style={{ color: '#7f7f7f' }}>$</span>
                            <input type="text" inputMode="numeric" value={item.price} onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)} style={{ width: '90px', textAlign: 'right', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '6px', fontWeight: 600, color: '#e63946' }} />
                          </div>
                        </td>
                        <td data-label="Vr. Total" style={{ padding: '10px', verticalAlign: 'top', textAlign: 'right', fontWeight: 700, color: '#333333', paddingTop: '16px' }}>
                          {fmt((item.qty || 0) * (item.price || 0))}
                        </td>
                        <td className="actions-cell" style={{ padding: '10px', verticalAlign: 'top', textAlign: 'center', paddingTop: '14px' }}>
                          <button onClick={() => removeFromCart(idx)} className="remove-item-btn" title="Quitar item">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* Columna Derecha: Configuración Cliente */}
          <div>
            <div className="panel-card" style={{ marginBottom: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557', fontSize: '15px' }}>👤 Información del Cliente</h3>
                {hasSelectedClient && (
                  <button onClick={clearClientSelection} style={{ background: 'none', border: 'none', color: '#e63946', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Cambiar</button>
                )}
              </div>

              {!isCreatingClient && !hasSelectedClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      value={clientSearchQuery} 
                      onChange={(e) => setClientSearchQuery(e.target.value)} 
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Buscar cliente registrado..." 
                      style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px', cursor: 'pointer' }}
                    />
                    
                    {showSuggestions && (
                      <div style={{ position: 'absolute', top: 44 + 'px', left: 0, right: 0, background: 'white', border: '1px solid #d8d8d8', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 999, maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredClients.map(c => (
                          <div key={c.id} onClick={() => selectClient(c)} style={{ padding: '10px 14px', borderBottom: '1px solid #f2f2f2', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f7f7f7'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.nombre}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>NIT/CC: {c.identificacion}</div>
                          </div>
                        ))}
                        {cQuery.length > 0 && filteredClients.length === 0 && (
                          <div onClick={createClientFromQuery} style={{ padding: '12px 14px', cursor: 'pointer', color: '#e63946', fontWeight: 600, fontSize: '12px' }}>
                            + Registrar "{clientSearchQuery}" como cliente nuevo
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center', padding: '8px 0', borderTop: '1px solid #eee', marginTop: '4px' }}>
                    <button onClick={() => setIsCreatingClient(true)} style={{ background: '#457b9d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', width: '100%' }}>+ Registrar Cliente Nuevo</button>
                  </div>
                </div>
              )}

              {isCreatingClient && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>Nombre / Razón Social *</label>
                    <input value={newClient.nombre} onChange={(e) => setNewClient(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej. Smart Fit Unicentro" style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>Identificación (NIT/CC) *</label>
                    <input value={newClient.identificacion} onChange={(e) => setNewClient(prev => ({ ...prev, identificacion: e.target.value }))} placeholder="Ej. 901.444.555-2" style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>Dirección</label>
                    <input value={newClient.direccion} onChange={(e) => setNewClient(prev => ({ ...prev, direccion: e.target.value }))} placeholder="Dirección completa, Ciudad" style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>Teléfono</label>
                    <input value={newClient.telefono} onChange={(e) => setNewClient(prev => ({ ...prev, telefono: e.target.value }))} placeholder="Ej. +57 321 000 0000" style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#888' }}>Correo Electrónico</label>
                    <input value={newClient.email} onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))} placeholder="correo@empresa.com" style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={saveClientToDb} style={{ flex: 1, background: '#e63946', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer' }}>Guardar</button>
                    <button onClick={() => setIsCreatingClient(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #ccc', color: '#666', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </div>
              )}

              {hasSelectedClient && (
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #eaeaea', fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1d3557', marginBottom: '4px' }}>{client.name}</div>
                  <div>NIT/CC: {client.id}</div>
                  {client.address && <div>Dirección: {client.address}</div>}
                  {client.phone && <div>Teléfono: {client.phone}</div>}
                  {client.email && <div>Email: {client.email}</div>}
                </div>
              )}
            </div>

            {/* Detalles de Cotización */}
            <div className="panel-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557', fontSize: '15px' }}>⚙️ Configuración del Documento</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>Número de Cotización</label>
                  <input value={client.quoteNo} onChange={(e) => setClient(prev => ({ ...prev, quoteNo: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px', fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>Asesor Comercial</label>
                  <input value={client.adviser} onChange={(e) => setClient(prev => ({ ...prev, adviser: e.target.value }))} style={{ width: '100%', boxSizing: 'border-box', background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '4px', padding: '10px', fontSize: '13px' }} />
                </div>
              </div>
            </div>

            {/* Panel de Envíos */}
            <div className="panel-card">
              <h3 style={{ margin: '0 0 16px', fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', color: '#1d3557', fontSize: '15px' }}>📤 Acciones y Envíos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={saveQuote} style={{ background: '#e63946', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>💾 Guardar</button>
                <button onClick={downloadPdf} style={{ background: '#1d3557', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>⬇️ Descargar PDF</button>
                <button onClick={sendEmail} style={{ background: '#457b9d', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>✉️ Enviar por Correo</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT VISOR (Print Container) */}
      <div className="print-container print-only pdf-doc" style={{ padding: 0 }}>

        {/* Marco con thead/tfoot: al imprimir, el navegador REPITE el encabezado
            y el pie en cada página y reserva su espacio automáticamente. En
            pantalla y en html2pdf el thead/tfoot van vacíos (no afectan). */}
        <table className="pdf-frame">
          <thead>
            <tr><td>
              <div className="pdf-running-header">
                <img src="assets/logo.png" alt="Fitness Life S.A.S" />
                <div className="rh-meta">
                  <div className="rh-title">Cotización</div>
                  <div>N.º <b>{client.quoteNo}</b> · {client.date} · Válida {client.validDays}</div>
                </div>
              </div>
            </td></tr>
          </thead>
          <tfoot>
            <tr><td>
              <div className="pdf-running-footer">
                FITNESS LIFE S.A.S — Importador Directo Autorizado en Colombia · ventas@fitnesslifesas.com · +57 (1) 555-0100
              </div>
            </td></tr>
          </tfoot>
          <tbody>
            <tr><td>

        {/* Cabecera */}
        <div className="doc-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', borderBottom: '3px solid #e63946', paddingBottom: '18px', marginBottom: '26px' }}>
          <img src="assets/logo.png" alt="Fitness Life S.A.S" style={{ height: '72px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '30px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1, color: '#2d2d2d' }}>Cotización</div>
            <div style={{ fontSize: '11px', color: '#727272', marginTop: '8px', lineHeight: '1.7' }}>
              <div>N.º <span style={{ fontWeight: 600, color: '#333333' }}>{client.quoteNo}</span></div>
              <div>Fecha <span style={{ color: '#333333' }}>{client.date}</span></div>
              <div>Válida por <span style={{ color: '#333333' }}>{client.validDays}</span></div>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="info-grid-mobile">
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#e63946', fontWeight: 700, marginBottom: '8px' }}>Cliente</div>
            <div style={{ fontSize: '13px', lineHeight: '1.9' }}>
              <div style={{ fontWeight: 600, color: '#333333', fontSize: '15px' }}>{client.name || 'Sin Cliente'}</div>
              <div>NIT / C.C.: {client.id}</div>
              <div>Dirección: {client.address}</div>
              <div>Teléfono: {client.phone}</div>
              <div>Email: {client.email}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#e63946', fontWeight: 700, marginBottom: '8px' }}>Asesor comercial</div>
            <div style={{ fontSize: '13px', lineHeight: '1.9' }}>
              <div style={{ fontWeight: 600, color: '#333333', fontSize: '14px' }}>{client.adviser}</div>
              <div>Fitness Life S.A.S</div>
              <div>ventas@fitnesslifesas.com</div>
              <div>+57 (1) 555-0100</div>
            </div>
          </div>
        </div>

        {/* Tabla de Items */}
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#2d2d2d', color: 'white' }}>
                <th style={{ padding: '11px 10px', textAlign: 'left', fontFamily: 'Oswald, sans-serif', fontWeight: 500, letterSpacing: '.1em', fontSize: '10px', textTransform: 'uppercase', width: '104px' }}>Imagen</th>
                <th style={{ padding: '11px 10px', textAlign: 'left', fontFamily: 'Oswald, sans-serif', fontWeight: 500, letterSpacing: '.1em', fontSize: '10px', textTransform: 'uppercase' }}>Descripción</th>
                <th style={{ padding: '11px 10px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 500, letterSpacing: '.1em', fontSize: '10px', textTransform: 'uppercase', width: '52px' }}>Cant.</th>
                <th style={{ padding: '11px 10px', textAlign: 'right', fontFamily: 'Oswald, sans-serif', fontWeight: 500, letterSpacing: '.1em', fontSize: '10px', textTransform: 'uppercase', width: '104px' }}>Vr. Unitario</th>
                <th style={{ padding: '11px 10px', textAlign: 'right', fontFamily: 'Oswald, sans-serif', fontWeight: 500, letterSpacing: '.1em', fontSize: '10px', textTransform: 'uppercase', width: '110px' }}>Vr. Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td data-label="Imagen" className="img-cell" style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                    <div className="row-img" style={{ width: '84px', height: '66px', border: '1px dashed #c6c6c6', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                      <img src={row.img} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  </td>
                  <td data-label="Descripción" className="desc-cell" style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#333333' }}>{row.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#727272', lineHeight: '1.5', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{row.desc}</div>
                  </td>
                  <td data-label="Cant." style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'top', fontWeight: 600, fontSize: '14px' }}>{row.qty}</td>
                  <td data-label="Vr. Unitario" style={{ padding: '12px 10px', textAlign: 'right', verticalAlign: 'top', color: '#595959' }}>{fmt(row.price)}</td>
                  <td data-label="Vr. Total" style={{ padding: '12px 10px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#333333' }}>{fmt((row.qty || 0) * (row.price || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="avoid-break" style={{ textAlign: 'right', marginTop: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div className="total-box-mobile" style={{ display: 'inline-block', textAlign: 'left', width: '320px', fontSize: '14px', maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e0e0e0' }}>
              <span style={{ color: '#727272' }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#333333' }}>{fmt(subtotalNum)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #e0e0e0' }}>
              <span style={{ color: '#727272' }}>IVA (19%)</span>
              <span style={{ fontWeight: 600, color: '#333333' }}>{fmt(ivaNum)}</span>
            </div>
            <div className="totals-bg" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#e63946', color: 'white', fontFamily: 'Oswald, sans-serif', fontSize: '20px', fontWeight: 600, letterSpacing: '.03em', borderRadius: '0 0 8px 8px' }}>
              <span>TOTAL</span>
              <span>{fmt(totalNum)}</span>
            </div>
          </div>
        </div>

        {/* Condiciones comerciales */}
        <div className="quote-terms" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#e63946', fontWeight: 700, marginBottom: '12px' }}>Condiciones comerciales</div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6b6b6b', lineHeight: '1.85' }}>
            <li>Precios en pesos colombianos (COP). Validez de la oferta según la fecha de expiración indicada.</li>
            <li>Forma de pago: 50% anticipo, 50% contra entrega, salvo acuerdo distinto por escrito.</li>
            <li>Tiempo de entrega sujeto a disponibilidad de inventario al momento de la orden.</li>
            <li>Incluye garantía Fitness Life y soporte técnico especializado post-venta.</li>
            <li>Instalación y transporte se cotizan por separado según ubicación geográfica.</li>
          </ul>
        </div>

        {/* Pie de Página Documento (pantalla / html2pdf; en impresión se usa el pie recurrente) */}
        <div className="quote-footer avoid-break" style={{ borderTop: '1px solid #d8d8d8', paddingTop: '12px', marginTop: '48px', fontSize: '10px', color: '#7f7f7f', letterSpacing: '.04em', textAlign: 'center', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ marginBottom: '6px' }}>FITNESS LIFE S.A.S — Importador Directo Autorizado en Colombia</div>
          <div>ventas@fitnesslifesas.com · +57 (1) 555-0100</div>
        </div>

            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
    </AuthBoundary>
  );
}
