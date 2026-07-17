"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '@/lib/hooks/use-orders';
import { formatFrenchDate } from './OrdersSectionHelpers';
import { formatPrice } from '@/lib/price';

interface OrderPrintReceiptProps {
  order: Order;
  onClose: () => void;
}

export function OrderPrintReceipt({ order, onClose }: OrderPrintReceiptProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        window.print();
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div id="print-receipt-root" className="print-receipt font-mono text-black bg-white flex flex-col justify-between" style={{ width: '10cm', height: '15cm', padding: '10px', boxSizing: 'border-box' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media screen {
          #print-receipt-root {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: 10cm 15cm;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > *:not(#print-receipt-root) {
            display: none !important;
          }
          #print-receipt-root {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 10cm !important;
            height: 15cm !important;
            margin: 0 !important;
            padding: 10px !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            font-family: monospace, Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
          }
        }
      `}} />
      
      <div>
        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <h1 className="text-sm font-bold uppercase tracking-wider">CANDY ECO</h1>
          <p className="text-[9px] text-gray-700">Reçu de Commande</p>
          <p className="font-bold text-xs mt-1">Ref: {order.reference || `#${order.id.substring(0, 8).toUpperCase()}`}</p>
          <p className="text-[9px]">{formatFrenchDate(order.createdAt)}</p>
        </div>

        {/* Customer Details */}
        <div className="border-b border-dashed border-black pb-2 mb-2 text-[10px] space-y-0.5">
          <p className="font-bold text-xs">Client :</p>
          <p><span className="font-semibold">Nom :</span> {order.customerName || 'N/A'}</p>
          <p><span className="font-semibold">Tél :</span> {order.customerPhone || 'N/A'}</p>
          {order.customerEmail && <p><span className="font-semibold">Email :</span> {order.customerEmail}</p>}
          <p><span className="font-semibold">Adresse :</span> {order.shippingAddress || 'N/A'}</p>
          {order.deliveryMethod && <p><span className="font-semibold">Mode Livraison :</span> {order.deliveryMethod}</p>}
        </div>

        {/* Purchased Items Table */}
        <div className="mb-2">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="pb-1 py-1">Produit</th>
                <th className="text-center pb-1 py-1 w-10">Qté</th>
                <th className="text-right pb-1 py-1 w-16">P.U.</th>
                <th className="text-right pb-1 py-1 w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const price = parseFloat(item.priceAtPurchase || '0');
                const total = price * item.quantity;
                return (
                  <tr key={item.id} className="border-b border-gray-200 last:border-0">
                    <td className="py-1 line-clamp-1 max-w-[120px]">{item.product?.title || 'Produit Inconnu'}</td>
                    <td className="text-center py-1 font-bold">x{item.quantity}</td>
                    <td className="text-right py-1">{price.toFixed(2)} €</td>
                    <td className="text-right py-1 font-semibold">{total.toFixed(2)} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand Total */}
      <div className="border-t border-black pt-2 mt-auto">
        <div className="flex justify-between items-center text-xs font-bold">
          <span>TOTAL :</span>
          <span className="text-sm">{formatPrice(order.totalPrice)}</span>
        </div>
        <div className="text-center text-[8px] text-gray-500 mt-2 border-t border-dashed border-gray-200 pt-1">
          Merci pour votre commande !
        </div>
      </div>
    </div>,
    document.body
  );
}
