"use client";

import { formatPrecio } from "@/lib/utils";
import { usePedidoConfirm } from "@/viewmodels/usePedidoConfirm";
import {
  ShoppingCart, Trash2, StickyNote, Plus, ArrowLeft,
  Loader2, AlertCircle, MapPin, ShieldCheck, Check,
  X, Utensils,
} from "lucide-react";

export default function PedidoPage() {
  const vm = usePedidoConfirm();

  if (vm.items.length === 0) {
    return (
      <div className="order-page">
        <div className="order-panel order-empty-panel">
          <ShoppingCart size={52} color="var(--primary)" />
          <h1>Carrito vacío</h1>
          <p>Agrega platos desde el menú para preparar tu pedido.</p>
          <button onClick={vm.goToMenu} className="btn btn-primary">
            <ArrowLeft size={16} /> Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="order-page animate-fade-in">
      <section className="order-panel">
        <header className="order-header">
          <div>
            <div className="order-title-row">
              <ShoppingCart size={30} />
              <h1>Mi Pedido</h1>
            </div>
            <p>Mesa {vm.mesa?.numero || "—"} · {vm.items.length} item{vm.items.length > 1 ? "s" : ""}</p>
          </div>
          <button type="button" onClick={vm.goToMenu} className="order-close-button" aria-label="Volver al menú">
            <X size={22} />
          </button>
        </header>

        <div className="order-items-list">
          {vm.items.map((item) => {
            const image = item.producto.imagen_url || "/assets/placeholder-dish.png";
            const itemTotal = item.precio_total * item.cantidad;
            return (
              <article key={item.id} className="order-item-card">
                <div className="order-item-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={item.producto.nombre} />
                </div>
                <div className="order-item-info">
                  <div className="order-item-main">
                    <h2>{item.producto.nombre}</h2>
                    <strong>{formatPrecio(itemTotal)}</strong>
                  </div>
                  {item.notas && <p className="order-item-note"><StickyNote size={10} /> {item.notas}</p>}
                  {item.agregados_seleccionados.length > 0 && (
                    <div className="order-extra-list">
                      {item.agregados_seleccionados.map((extra) => <span key={extra.id}><Plus size={8} /> {extra.nombre}</span>)}
                    </div>
                  )}
                  <div className="order-item-controls">
                    <div className="order-qty-stepper">
                      <button type="button" onClick={() => vm.updateCantidad(item.id, item.cantidad - 1)}>-</button>
                      <span>{item.cantidad}</span>
                      <button type="button" onClick={() => vm.updateCantidad(item.id, item.cantidad + 1)}>+</button>
                    </div>
                    <button type="button" onClick={() => vm.removeItem(item.id)} className="order-trash-button" aria-label="Eliminar plato">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="order-upsell-card">
          <div><Utensils size={24} /></div>
          <section>
            <h2>¿Algo más para tu pedido?</h2>
            <p>Explora nuestro menú y agrega más platos deliciosos.</p>
            <button type="button" onClick={vm.goToMenu}>Ver menú</button>
          </section>
        </aside>

        <label className="order-notes">
          <span>Notas del pedido (opcional)</span>
          <input className="input" placeholder="Instrucciones especiales..." value={vm.notas} onChange={(e) => vm.setNotas(e.target.value)} />
        </label>

        {vm.geoStatus === "checking" && (
          <div className="order-status-note info"><MapPin size={14} /> Verificando ubicación del restaurante...</div>
        )}
        {vm.geoStatus === "ok" && (
          <div className="order-status-note success"><ShieldCheck size={14} /> Ubicación válida, estás dentro del restaurante.</div>
        )}

        {vm.error && (
          <div className="order-status-note error"><AlertCircle size={14} /> {vm.error}</div>
        )}

        <footer className="order-total-row">
          <span>Total</span>
          <strong>{formatPrecio(vm.total)}</strong>
        </footer>

        <div className="order-actions">
          <button onClick={vm.handleConfirmar} className="order-confirm-button" disabled={vm.sending}>
            {vm.sending ? (
              vm.geoStatus === "checking" ? <><MapPin size={16} /> Verificando...</> : <><Loader2 size={16} className="spin-icon" /> Enviando...</>
            ) : (
              <><Check size={18} /> Confirmar pedido</>
            )}
          </button>
          <button onClick={vm.goToMenu} className="order-back-button"><ArrowLeft size={16} /> Volver al menú</button>
        </div>
      </section>
    </main>
  );
}
