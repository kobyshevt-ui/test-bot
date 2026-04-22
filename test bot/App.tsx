import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Send, 
  LayoutDashboard, 
  Bell, 
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

interface Stats {
  users: number;
  orders: number;
  revenue: number;
  recentOrders: any[];
}

type Tab = 'dashboard' | 'users' | 'orders';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchData = async () => {
    try {
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) setStats(await statsRes.json());

      if (activeTab === 'users') {
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) setUsersList(await usersRes.json());
      }

      if (activeTab === 'orders') {
        const ordersRes = await fetch('/api/all-orders');
        if (ordersRes.ok) setOrdersList(await ordersRes.json());
      }
      
      setError(null);
    } catch (err) {
      setError("Ошибка соединения с сервером");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg })
      });
      if (res.ok) {
        alert("Рассылка запущена!");
        setBroadcastMsg("");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div>
          <Bell className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Ошибка!</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Обновить</button>
        </div>
      </div>
    );
  }

  if (!stats) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <LayoutDashboard className="w-12 h-12 text-blue-500 mb-4" />
        <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Инициализация...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm z-20">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
             <MessageSquare className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-black italic tracking-tighter text-slate-800">BOTADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <LayoutDashboard className="mr-3 w-5 h-5" /> Дашборд
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Users className="mr-3 w-5 h-5" /> Пользователи
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <ShoppingBag className="mr-3 w-5 h-5" /> Заказы
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100 italic text-[10px] text-slate-400 text-center uppercase tracking-widest">v1.2 Stable Build</div>
      </aside>

      {/* Main Container */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
           <h2 className="text-lg font-bold text-slate-800 capitalize">{activeTab === 'dashboard' ? 'Аналитика' : activeTab === 'users' ? 'База пользователей' : 'Журнал заказов'}</h2>
           <div className="flex items-center gap-4">
              <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600"><Search className="w-5 h-5" /></button>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">Root Admin</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase">Online</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
              </div>
           </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Пользователи</p>
                    <h3 className="text-4xl font-black text-slate-900">{stats.users}</h3>
                  </div>
                  <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-50 group-hover:text-blue-100 transition-colors" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Заказы</p>
                    <h3 className="text-4xl font-black text-slate-900">{stats.orders}</h3>
                  </div>
                  <ShoppingBag className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-50 group-hover:text-emerald-100 transition-colors" />
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Выручка</p>
                    <h3 className="text-4xl font-black text-slate-900">{stats.revenue.toLocaleString()} ₽</h3>
                  </div>
                  <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-50 group-hover:text-amber-100 transition-colors" />
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Broadcast UI */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-fit">
                   <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Мгновенная рассылка</h3>
                      <Send className="w-4 h-4 text-slate-300" />
                   </div>
                   <div className="p-8">
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">Ваше сообщение будет отправлено моментально всем пользователям, которые когда-либо запускали бота.</p>
                      <textarea 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-sm focus:border-blue-500 focus:bg-white transition-all outline-none"
                        placeholder="Текст вашего сообщения..."
                        rows={6}
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                      />
                      <button 
                        onClick={handleBroadcast}
                        disabled={isSending || !broadcastMsg}
                        className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:bg-slate-200"
                      >
                        {isSending ? 'Отправка...' : 'Запустить эфир'}
                      </button>
                   </div>
                </div>

                {/* Feed UI */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
                   <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Недавняя активность</h3>
                      <Filter className="w-4 h-4 text-slate-300" />
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {stats.recentOrders.length > 0 ? stats.recentOrders.map((o) => (
                        <div key={o.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-center justify-between">
                           <div>
                              <p className="text-xs font-black text-slate-800">{o.product_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase">@{o.username}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-emerald-600">+{o.amount} ₽</p>
                              <p className="text-[8px] text-slate-300 uppercase tracking-widest">{new Date(o.created_at).toLocaleTimeString()}</p>
                           </div>
                        </div>
                      )) : (
                        <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">Транзакций пока нет</div>
                      )}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Имя</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Админ</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{u.telegram_id}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{u.first_name}</td>
                        <td className="px-6 py-4 text-sm text-blue-500">@{u.username}</td>
                        <td className="px-6 py-4 text-xs">
                          {u.is_admin ? <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold">YES</span> : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </motion.div>
          )}

          {activeTab === 'orders' && (activeTab === 'orders' && stats) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Заказ #</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Товар</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Сумма</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Клиент</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ordersList.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{o.id}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{o.product_name}</td>
                        <td className="px-6 py-4 text-sm font-black text-slate-900">{o.amount} ₽</td>
                        <td className="px-6 py-4 text-sm text-blue-500">@{o.username}</td>
                        <td className="px-6 py-4 font-black">
                           <span className={`text-[10px] ${o.status === 'paid' ? 'text-emerald-500 uppercase' : 'text-amber-500 uppercase'}`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
