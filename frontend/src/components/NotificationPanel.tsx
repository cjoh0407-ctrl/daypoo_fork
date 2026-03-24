import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Info, Trophy, MessageSquare, Zap, Sparkles } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    notifications, 
    fetchNotifications, 
    markAllAsRead, 
    deleteNotification,
    showToast,
    setNotifications 
  } = useNotification();

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const deleteNotif = (id: number) => {
    deleteNotification(id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[2000] bg-black/20 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[2001] w-full max-w-[400px] h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f4faf6] flex items-center justify-center text-[#1B4332]">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="font-black text-lg text-[#1a2b22]">알림 센터</h2>
                  <p className="text-[11px] font-bold text-[#7a9e8a] uppercase tracking-wider">Recent Updates</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative group p-4 rounded-2xl border-2 transition-all ${
                        n.isRead ? 'bg-white border-gray-50' : 'bg-[#f4faf6]/50 border-[#1B4332]/10'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'ACHIEVEMENT' ? 'bg-amber-50 text-amber-500' :
                          n.type === 'INQUIRY_REPLY' ? 'bg-blue-50 text-blue-500' :
                          'bg-emerald-50 text-emerald-500'
                        }`}>
                          {n.type === 'ACHIEVEMENT' ? <Trophy size={20} /> :
                           n.type === 'INQUIRY_REPLY' ? <MessageSquare size={20} /> :
                           <Info size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={`text-sm font-black truncate ${n.isRead ? 'text-gray-500' : 'text-[#1a2b22]'}`}>
                              {n.title}
                            </h3>
                            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${n.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                            {n.content}
                          </p>
                          
                          <button 
                            onClick={() => deleteNotif(n.id)}
                            className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                    <Sparkles size={40} />
                  </div>
                  <div>
                    <p className="font-black text-[#1a2b22]">오늘 변은 어떠셨나요?</p>
                    <p className="text-sm text-[#7a9e8a] mt-1">도착한 새로운 알림이 없습니다.</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 flex flex-col gap-3">
              <button 
                className="text-xs font-bold text-[#1B4332]/40 hover:text-[#1B4332] transition-colors text-center"
                onClick={handleMarkAllRead}
              >
                모두 읽음으로 표시
              </button>
              
              {/* 알림 테스트 도구 */}
              <div className="mt-2 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 px-1">Debug: Notification Test</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      showToast('레벨업!', '축하합니다! 새로운 등급을 획득하셨습니다.', 'achievement');
                      setNotifications(prev => [{
                        id: Date.now(),
                        type: 'ACHIEVEMENT',
                        title: '레벨업!',
                        content: '축하합니다! 새로운 등급을 획득하셨습니다.',
                        isRead: false,
                        createdAt: new Date().toISOString()
                      }, ...prev]);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-gray-100 hover:border-amber-200 transition-all group"
                  >
                    <Trophy size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-gray-500">성취</span>
                  </button>
                  <button 
                    onClick={() => {
                      showToast('문의 답변', '문의하신 내용에 대해 답변이 도착했습니다.', 'message');
                      setNotifications(prev => [{
                        id: Date.now(),
                        type: 'INQUIRY_REPLY',
                        title: '문의 답변',
                        content: '문의하신 내용에 대해 답변이 도착했습니다.',
                        isRead: false,
                        createdAt: new Date().toISOString()
                      }, ...prev]);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-all group"
                  >
                    <MessageSquare size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-gray-500">메시지</span>
                  </button>
                  <button 
                    onClick={() => {
                      showToast('근처 화장실', '현재 위치 150m 이내에 화장실이 있습니다.', 'info');
                      setNotifications(prev => [{
                        id: Date.now(),
                        type: 'INFO',
                        title: '근처 화장실',
                        content: '현재 위치 150m 이내에 화장실이 있습니다.',
                        isRead: false,
                        createdAt: new Date().toISOString()
                      }, ...prev]);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-gray-100 hover:border-emerald-200 transition-all group"
                  >
                    <Bell size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-gray-500">시스템</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
