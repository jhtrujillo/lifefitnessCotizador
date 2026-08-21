import React, { useState, useEffect } from 'react';
import { getApiUrl, fetchWithAuth, clearAuth } from '../../utils/api';
import AuthBoundary from '../../components/AuthBoundary';

const fmt = (n) => '$ ' + Math.round(n).toLocaleString('es-CO');

export default function VerCotizacion() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [client, setClient] = useState({});
  const [items, setItems] = useState([]);
  const [subtotalNum, setSubtotalNum] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const quoteId = params.get('id');
    
    if (!quoteId) {
      setIsLoading(false);
      setIsError(true);
      return;
    }

    fetchQuote(quoteId);
  }, []);

  const fetchQuote = (id) => {
    setIsLoading(true);
    fetchWithAuth('get_quotes')
      .then(data => {
        if (data.success) {
          const q = (data.quotes || []).find(x => String(x.id) === String(id));
          if (q) {
            // Parse client JSON
            let clientData = q.cliente_json || {};
            if (typeof clientData === 'string') {
              try { clientData = JSON.parse(clientData); } catch(e) {}
            }

            // Parse items JSON
            let itemsData = q.items_json || [];
            if (typeof itemsData === 'string') {
              try { itemsData = JSON.parse(itemsData); } catch(e) {}
            }

            const subTotal = itemsData.reduce((acc, it) => acc + (Number(it.qty || 0) * Number(it.price || 0)), 0);
            
            setClient(clientData);
            setItems(itemsData);
            setSubtotalNum(subTotal);
            setIsError(false);
          } else {
            setIsError(true);
          }
        } else {
          setIsError(true);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsError(true);
        setIsLoading(false);
      });
  };

  const ivaNum = subtotalNum * 0.19;
  const totalNum = subtotalNum + ivaNum;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#666666', fontFamily: 'Oswald, sans-serif', fontSize: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Cargando cotización...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#666666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontFamily: 'Oswald, sans-serif', margin: '0 0 8px', textTransform: 'uppercase', color: '#333333' }}>Cotización no encontrada</h2>
        <p style={{ margin: 0, fontSize: '15px' }}>El enlace es inválido o la cotización fue eliminada del sistema.</p>
      </div>
    );
  }

  return (
    <AuthBoundary>
    <div>
      <div className="no-print">
        {/* Encabezado de la App (Solo Pantalla) */}
        <header className="app-header" style={{ background: '#2d2d2d', color: 'white', padding: '16px 24px', borderBottom: '3px solid #e63946', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="assets/logo.png" alt="Fitness Life S.A.S" style={{ height: '50px', width: 'auto', background: 'white', padding: '4px', borderRadius: '4px' }} />
            <div>
              <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documento Comercial</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => window.print()} style={{ background: '#e63946', color: 'white', border: 'none', padding: '10px 20px', fontWeight: 600, fontSize: '13px', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              🖨️ Descargar PDF
            </button>
          </div>
        </header>
      </div>

      {/* VISOR DEL DOCUMENTO (Pantalla e Impresión) */}
      <div className="panel-card print-container">

        {/* Marco con thead/tfoot: al imprimir se repiten el encabezado y el pie
            en cada página. En pantalla van vacíos (running header/footer ocultos). */}
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
        <div className="client-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '30px' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#e63946', fontWeight: 700, marginBottom: '8px' }}>Cliente</div>
            <div style={{ fontSize: '13px', lineHeight: '1.9' }}>
              <div style={{ fontWeight: 600, color: '#333333', fontSize: '15px' }}>{client.name}</div>
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
        <div className="table-wrapper">
          <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '30px' }}>
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
              {items.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                    <div className="row-img" style={{ width: '84px', height: '66px', border: '1px dashed #c6c6c6', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '4px' }}>
                      {row.img ? (
                        <img src={row.img} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '10px', color: '#ccc' }}>No img</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#333333' }}>{row.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#727272', lineHeight: '1.5', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{row.desc}</div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', verticalAlign: 'top', fontWeight: 600, fontSize: '14px' }}>{row.qty}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', verticalAlign: 'top', color: '#595959' }}>{fmt(row.price || 0)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#333333' }}>{fmt((row.qty || 0) * (row.price || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="avoid-break" style={{ textAlign: 'right', marginTop: '10px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ display: 'inline-block', textAlign: 'left', width: '320px', fontSize: '14px', maxWidth: '100%' }}>
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
        <div className="quote-terms avoid-break" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #e0e0e0', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ fontSize: '11px', letterSpacing: '.22em', textTransform: 'uppercase', color: '#e63946', fontWeight: 700, marginBottom: '12px' }}>Condiciones comerciales</div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#6b6b6b', lineHeight: '1.85' }}>
            <li>Precios en pesos colombianos (COP). Validez de la oferta según la fecha de expiración indicada.</li>
            <li>Forma de pago: 50% anticipo, 50% contra entrega, salvo acuerdo distinto por escrito.</li>
            <li>Tiempo de entrega sujeto a disponibilidad de inventario al momento de la orden.</li>
            <li>Incluye garantía Fitness Life y soporte técnico especializado post-venta.</li>
            <li>Instalación y transporte se cotizan por separado según ubicación geográfica.</li>
          </ul>
        </div>

        {/* Pie de Página Documento (pantalla; en impresión se usa el pie recurrente) */}
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
