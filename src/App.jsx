import React, { useState, useEffect, useRef } from 'react';
import { cardapio } from './cardapioData';
import { supabase } from './supabaseClient';

// Buscamos o dado fora do componente para garantir uma leitura limpa e imediata
const carrinhoSalvo = localStorage.getItem('tudo-na-massa-carrinho');
const carrinhoInicial = carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];

function App() {
  const [carrinho, setCarrinho] = useState(carrinhoInicial);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [etapaCheckout, setEtapaCheckout] = useState('carrinho');
  const [dadosCliente, setDadosCliente] = useState({ 
    nome: '', 
    telefone: '', 
    tipo: 'delivery', 
    endereco: '', 
    mesa: '',
    pagamento: 'pix' 
  });
  
  const [confirmouPix, setConfirmouPix] = useState(false);
  
  // Referência para controlar a primeira renderização e não resetar o localStorage
  const primeiraRenderizacao = useRef(true);

  // Força o reset do pagamento para 'pix' se mudar para delivery, evitando bugs
  useEffect(() => {
    if (dadosCliente.tipo === 'delivery') {
      setDadosCliente(prev => ({ ...prev, pagamento: 'pix' }));
    } else {
      setConfirmouPix(false);
    }
  }, [dadosCliente.tipo]);

  // Atualiza o localStorage toda vez que o carrinho mudar, pulando a inicialização vazia
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    localStorage.setItem('tudo-na-massa-carrinho', JSON.stringify(carrinho));
  }, [carrinho]);

  const totalCarrinho = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // CORREÇÃO AQUI (Linha 33): Envolvido o retorno do map com parênteses ()
  const adicionarAoCarrinho = (item) => {
    setCarrinho(carrinhoAtual => {
      const itemExiste = carrinhoAtual.find(i => i.id === item.id);
      return itemExiste 
        ? carrinhoAtual.map(i => i.id === item.id ? ({ ...i, quantidade: i.quantidade + 1 }) : i)
        : [...carrinhoAtual, { ...item, quantidade: 1 }];
    });
  };

  // CORREÇÃO AQUI (Linha 52): Envolvido o retorno do map com parênteses ()
  const alterarQuantidade = (id, delta) => {
    setCarrinho(carrinhoAtual => 
      carrinhoAtual.map(i => i.id === id ? ({ ...i, quantidade: Math.max(0, i.quantidade + delta) }) : i)
      .filter(i => i.quantidade > 0)
    );
  };

  const copiarPix = () => {
    const chavePix = "SUA_CHAVE_PIX_AQUI"; 
    navigator.clipboard.writeText(chavePix);
    alert("Chave PIX copiada com sucesso! Abra o app do seu banco para pagar.");
  };

  const finalizarPedido = async () => {
    if (!dadosCliente.nome || !dadosCliente.telefone) {
      alert("Por favor, preencha o nome e telefone!");
      return;
    }

    if (dadosCliente.tipo === 'delivery' && !dadosCliente.endereco) {
      alert("Por favor, preencha o endereço de entrega!");
      return;
    }

    if (dadosCliente.tipo === 'mesa' && !dadosCliente.mesa) {
      alert("Por favor, informe o número da mesa!");
      return;
    }

    if (dadosCliente.tipo === 'delivery' && !confirmouPix) {
      alert("Você precisa realizar o pagamento via PIX antes de enviar o pedido!");
      return;
    }

    const itensFormatados = carrinho.map(i => `${i.quantidade}x ${i.nome}`).join(', ');

    const pedido = {
      cliente_nome: dadosCliente.nome,
      cliente_telefone: dadosCliente.telefone,
      tipo_consumo: dadosCliente.tipo.toUpperCase(),
      localizacao: dadosCliente.tipo === 'delivery' ? dadosCliente.endereco : `Mesa ${dadosCliente.mesa}`,
      itens: itensFormatados,
      pagamento: dadosCliente.pagamento.toUpperCase(),
      total: totalCarrinho,
      status: 'PENDENTE'
    };

    const { error } = await supabase.from('pedidos').insert([pedido]);

    if (error) {
      alert("Erro ao enviar pedido: " + error.message);
    } else {
      alert("Pedido enviado com sucesso para a cozinha!");
      setCarrinho([]);
      setSacolaAberta(false);
      setEtapaCheckout('carrinho');
      setConfirmouPix(false);
      setDadosCliente({ nome: '', telefone: '', tipo: 'delivery', endereco: '', mesa: '', pagamento: 'pix' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white font-sans">
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-[#141414]/90 p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black text-amber-400">TUDO NA MASSA</h1>
            <p className="text-xs text-zinc-400">Leve, Artesanal e Irresistível!</p>
          </div>
          <button 
            onClick={() => setSacolaAberta(true)} 
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
          >
            🛒 Minha Sacola ({totalItens})
          </button>
        </div>
      </header>

      {/* CARDÁPIO */}
      <main className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        {Object.entries(cardapio).map(([key, cat]) => (
          <section key={key}>
            <h2 className="text-lg font-bold border-l-4 border-amber-400 pl-2 mb-4 uppercase tracking-wider">{cat.nome}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {cat.itens.map(item => (
                <div key={item.id} className="bg-[#141414] p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition">
                  <div className="pr-4 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-zinc-100">{item.nome}</h3>
                      {item.destaque && <span className="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-medium">★ Mais Pedido</span>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 whitespace-normal break-words">{item.descricao}</p>
                    <p className="text-amber-400 font-bold mt-2 text-sm">R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <button 
                    onClick={() => adicionarAoCarrinho(item)} 
                    className="bg-zinc-800 hover:bg-amber-500 hover:text-black h-9 w-28 rounded-lg font-bold text-xs transition border border-zinc-700 hover:border-amber-500"
                  >
                    + Adicionar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* GAVETA DA SACOLA */}
      {sacolaAberta && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 flex justify-end">
          <div className="w-full max-w-sm bg-[#141414] h-full p-6 rounded-l-2xl shadow-xl flex flex-col border-l border-zinc-800">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="font-bold text-lg text-zinc-100">Sua Sacola</h2>
              <button onClick={() => setSacolaAberta(false)} className="text-zinc-400 hover:text-white transition text-sm">Fechar ✕</button>
            </div>
            
            {etapaCheckout === 'carrinho' ? (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {carrinho.length === 0 ? (
                    <p className="text-zinc-500 text-center text-sm py-8">Sua sacola está vazia.</p>
                  ) : (
                    carrinho.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-[#0b0b0b] p-3 rounded-lg border border-zinc-800">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-bold text-zinc-200">{item.nome}</p>
                          <p className="text-amber-400 text-xs font-semibold mt-0.5">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
                          <button onClick={() => alterarQuantidade(item.id, -1)} className="font-bold text-zinc-300 hover:text-white text-sm">-</button>
                          <span className="text-sm font-bold text-zinc-200 w-4 text-center">{item.quantidade}</span>
                          <button onClick={() => alterarQuantidade(item.id, 1)} className="font-bold text-zinc-300 hover:text-white text-sm">+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {carrinho.length > 0 && (
                  <div className="border-t border-zinc-800 pt-4 mt-4 space-y-3">
                    <div className="flex justify-between text-sm text-zinc-400 px-1">
                      <span>Total de itens:</span>
                      <span>{totalItens}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-zinc-100 px-1">
                      <span>Total a pagar:</span>
                      <span className="text-amber-400">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button 
                      onClick={() => setEtapaCheckout('dados')} 
                      className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-bold mt-2 transition text-sm tracking-wide"
                    >
                      Avançar para Dados
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Informações de Entrega</h3>
                  
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Seu Nome</label>
                    <input value={dadosCliente.nome} onChange={e => setDadosCliente({...dadosCliente, nome: e.target.value})} placeholder="Ex: João Silva" className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white" />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Telefone de Contato</label>
                    <input value={dadosCliente.telefone} onChange={e => setDadosCliente({...dadosCliente, telefone: e.target.value})} placeholder="(48) 99999-0000" className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white" />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Como vai consumir?</label>
                    <select value={dadosCliente.tipo} onChange={e => setDadosCliente({...dadosCliente, tipo: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white">
                      <option value="delivery">Delivery (Entrega em Casa)</option>
                      <option value="mesa">Consumir no Local (Mesa)</option>
                    </select>
                  </div>

                  {dadosCliente.tipo === 'delivery' ? (
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Endereço Completo</label>
                      <textarea value={dadosCliente.endereco} onChange={e => setDadosCliente({...dadosCliente, endereco: e.target.value})} placeholder="Rua, Número, Bairro e Ponto de Referência" rows="2" className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white resize-none" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Número da Mesa</label>
                      <input value={dadosCliente.mesa} onChange={e => setDadosCliente({...dadosCliente, mesa: e.target.value})} placeholder="Ex: 05" className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white" />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Forma de Pagamento</label>
                    {dadosCliente.tipo === 'delivery' ? (
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-sm text-amber-400 font-semibold flex flex-col gap-2">
                        <span>PAGAMENTO ANTECIPADO VIA PIX</span>
                        <button 
                          type="button" 
                          onClick={copiarPix} 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 rounded transition"
                        >
                          📋 Copiar Chave PIX
                        </button>
                        <label className="flex items-center gap-2 mt-2 text-white font-normal text-xs cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={confirmouPix} 
                            onChange={(e) => setConfirmouPix(e.target.checked)}
                            className="rounded accent-emerald-500"
                          />
                          Já realizei o pagamento via PIX
                        </label>
                      </div>
                    ) : (
                      <select value={dadosCliente.pagamento} onChange={e => setDadosCliente({...dadosCliente, pagamento: e.target.value})} className="w-full bg-zinc-900 p-3 rounded-lg border border-zinc-800 focus:border-zinc-600 text-sm outline-none text-white">
                        <option value="pix">Pix (Pagar na Mesa)</option>
                        <option value="cartao_credito">Cartão de Crédito (Pagar na Mesa)</option>
                        <option value="cartao_debito">Cartão de Débito (Pagar na Mesa)</option>
                        <option value="dinheiro">Dinheiro (Pagar na Mesa)</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-base font-bold text-zinc-300 px-1 mb-2">
                    <span>Total do Pedido:</span>
                    <span className="text-amber-400 font-black">R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  <button 
                    onClick={finalizarPedido} 
                    disabled={dadosCliente.tipo === 'delivery' && !confirmouPix}
                    className={`w-full p-3 rounded-lg font-bold transition text-sm tracking-wide shadow-lg ${
                      dadosCliente.tipo === 'delivery' && !confirmouPix 
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                    }`}
                  >
                    {dadosCliente.tipo === 'delivery' && !confirmouPix ? 'Aguardando Pagamento...' : 'Enviar para Cozinha'}
                  </button>

                  <button onClick={() => setEtapaCheckout('carrinho')} className="w-full text-zinc-500 hover:text-zinc-400 text-xs py-2 transition font-medium">
                    ← Voltar para a Sacola
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;