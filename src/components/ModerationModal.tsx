import React, { useState } from 'react';
import {
  Inbox,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  Hammer,
  User,
  Clock,
  MessageSquare,
  ShieldCheck,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Send,
  FileQuestion,
  Filter,
} from 'lucide-react';
import { ProposalItem, LatzEvent, MegaProject, EVENT_CATEGORIES, ProposalStatus } from '../types';

interface ModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: ProposalItem[];
  onApproveEvent: (proposalId: string, event: LatzEvent) => void;
  onApproveProject: (proposalId: string, project: MegaProject) => void;
  onRejectProposal: (proposalId: string, reason?: string) => void;
  onDeleteProposal: (proposalId: string) => void;
  onRestoreProposal: (proposalId: string) => void;
  onClearHistory: () => void;
  onShowToast: (msg: string) => void;
}

const COMMON_REJECT_REASONS = [
  'Дубликат уже существующего события/проекта',
  'Недостаточно информации или описания',
  'Некорректные координаты или дата',
  'Не соответствует тематике сервера',
];

export const ModerationModal: React.FC<ModerationModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onApproveEvent,
  onApproveProject,
  onRejectProposal,
  onDeleteProposal,
  onRestoreProposal,
  onClearHistory,
  onShowToast,
}) => {
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'event' | 'project'>('all');
  const [rejectingProposal, setRejectingProposal] = useState<ProposalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen) return null;

  const pendingCount = proposals.filter((p) => p.status === 'pending').length;
  const approvedCount = proposals.filter((p) => p.status === 'approved').length;
  const rejectedCount = proposals.filter((p) => p.status === 'rejected').length;

  const filteredProposals = proposals.filter((p) => {
    // Status filter
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }
    // Type filter
    if (typeFilter !== 'all' && p.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const handleApprove = (proposal: ProposalItem) => {
    if (proposal.type === 'event' && proposal.eventData) {
      onApproveEvent(proposal.id, proposal.eventData);
    } else if (proposal.type === 'project' && proposal.projectData) {
      onApproveProject(proposal.id, proposal.projectData);
    }
  };

  const handleStartReject = (proposal: ProposalItem) => {
    setRejectingProposal(proposal);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingProposal) return;
    onRejectProposal(rejectingProposal.id, rejectReason.trim() || undefined);
    setRejectingProposal(null);
    setRejectReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#121212] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-[#1c1810] to-[#121212] border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-amber-200 tracking-tight">
                  Предложка и Модерация
                </h2>
                {pendingCount > 0 ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                    {pendingCount} на проверке
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Очередь чиста
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Заявки игроков на добавление событий в таймлайн и строек в каталог
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Status Tabs Bar */}
        <div className="px-5 py-2.5 bg-[#161616] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>На проверке</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'pending' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'approved'
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Одобренные</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'approved' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-red-500 text-white font-bold shadow-sm'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Отклонённые</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400'
              }`}>
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-neutral-200 text-black font-bold shadow-sm'
                  : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Все ({proposals.length})
            </button>
          </div>

          {/* Type Filter Sub-Selector */}
          <div className="flex items-center gap-1 bg-[#101010] p-1 rounded-lg border border-white/5 text-[11px]">
            <Filter className="w-3 h-3 text-neutral-400 ml-1" />
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                typeFilter === 'all' ? 'bg-white/15 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setTypeFilter('event')}
              className={`px-2 py-0.5 rounded transition-colors ${
                typeFilter === 'event' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              События
            </button>
            <button
              onClick={() => setTypeFilter('project')}
              className={`px-2 py-0.5 rounded transition-colors ${
                typeFilter === 'project' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Стройки
            </button>
          </div>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-neutral-200">
          {filteredProposals.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500">
                {statusFilter === 'pending' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                ) : (
                  <FileQuestion className="w-7 h-7 text-neutral-400" />
                )}
              </div>
              <h3 className="text-base font-bold text-white">
                {statusFilter === 'pending'
                  ? 'Все заявки проверены!'
                  : statusFilter === 'approved'
                  ? 'Нет одобренных заявок'
                  : statusFilter === 'rejected'
                  ? 'Нет отклонённых заявок'
                  : 'Заявки не найдены'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {statusFilter === 'pending'
                  ? 'В очереди предложки нет ожидающих заявок. Игроки могут отправить новые события через кнопку «Предложить событие».'
                  : 'Попробуйте переключить вкладку или фильтр типов выше.'}
              </p>
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const isEvent = proposal.type === 'event';
              const eventData = proposal.eventData;
              const projectData = proposal.projectData;
              const catConfig = isEvent && eventData ? EVENT_CATEGORIES[eventData.type] : null;

              return (
                <div
                  key={proposal.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-[#171717] border transition-all space-y-3.5 shadow-md ${
                    proposal.status === 'pending'
                      ? 'border-white/10 hover:border-amber-500/40'
                      : proposal.status === 'approved'
                      ? 'border-emerald-500/25 bg-[#131b15]'
                      : 'border-red-500/25 bg-[#1b1313]'
                  }`}
                >
                  {/* Meta header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                          isEvent
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {isEvent ? <Calendar className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
                        <span>{isEvent ? 'Событие' : 'Стройка'}</span>
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          proposal.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : proposal.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}
                      >
                        {proposal.status === 'pending' && 'На проверке'}
                        {proposal.status === 'approved' && 'Опубликовано'}
                        {proposal.status === 'rejected' && 'Отклонено'}
                      </span>

                      {catConfig && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: catConfig.badgeBg,
                            color: catConfig.badgeText,
                          }}
                        >
                          {catConfig.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-400" />
                        <span className="font-semibold text-neutral-200">@{proposal.submittedBy}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{proposal.submittedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content details */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">
                      {isEvent ? eventData?.title : projectData?.title}
                    </h3>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {isEvent ? eventData?.description : projectData?.description}
                    </p>

                    {/* Submitter comment note */}
                    {proposal.userComment && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-amber-300">Комментарий автора: </span>
                          <span>{proposal.userComment}</span>
                        </div>
                      </div>
                    )}

                    {/* Rejection reason if any */}
                    {proposal.status === 'rejected' && proposal.rejectReason && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold text-red-300">Причина отклонения: </span>
                          <span>{proposal.rejectReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Meta info tags */}
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-neutral-400 font-mono">
                      {isEvent && eventData && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            Дата: {eventData.date}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            Сезон: {eventData.season || 1}
                          </span>
                          {eventData.players && eventData.players.length > 0 && (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300">
                              Игроки: {eventData.players.join(', ')}
                            </span>
                          )}
                          {eventData.coordinates && (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-400">
                              X: {eventData.coordinates.x}, Z: {eventData.coordinates.z}
                            </span>
                          )}
                        </>
                      )}

                      {!isEvent && projectData && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-white/5">
                            Прогресс: {projectData.progressPercent}%
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300">
                            Строители: {projectData.builders.join(', ')}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-400">
                            X: {projectData.coordinates.x}, Z: {projectData.coordinates.z}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                    {/* Delete permanently button */}
                    <button
                      onClick={() => onDeleteProposal(proposal.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                      title="Удалить заявку навсегда"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить навсегда</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* If rejected, allow restore */}
                      {proposal.status === 'rejected' && (
                        <button
                          onClick={() => onRestoreProposal(proposal.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
                          title="Вернуть на повторную проверку"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Вернуть на проверку</span>
                        </button>
                      )}

                      {/* If pending, allow reject or approve */}
                      {proposal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStartReject(proposal)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors"
                            title="Отклонить заявку с указанием причины"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Отклонить</span>
                          </button>

                          <button
                            onClick={() => handleApprove(proposal)}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,230,118,0.25)]"
                            title="Одобрить и опубликовать"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Одобрить и опубликовать</span>
                          </button>
                        </>
                      )}

                      {/* If already approved, show badge and allow re-approve or delete */}
                      {proposal.status === 'approved' && (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Опубликовано</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rejection Prompt Dialog Modal Overlay */}
        {rejectingProposal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#181818] border border-red-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-bold text-white">
                    Отклонить заявку?
                  </h3>
                </div>
                <button
                  onClick={() => setRejectingProposal(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300">
                Заявка от <strong className="text-white">@{rejectingProposal.submittedBy}</strong> на «
                {rejectingProposal.type === 'event'
                  ? rejectingProposal.eventData?.title
                  : rejectingProposal.projectData?.title}
                » будет перемещена в раздел отклонённых.
              </p>

              {/* Quick Preset Reasons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Быстрый выбор причины:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_REJECT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-all ${
                        rejectReason === reason
                          ? 'bg-red-500/20 border-red-500/40 text-red-200'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-400">
                  Своя причина (опционально):
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingProposal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Отклонить заявку</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0e0e0e] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span>Всего в базе: <strong>{proposals.length}</strong></span>
            {proposals.some((p) => p.status !== 'pending') && (
              <button
                onClick={onClearHistory}
                className="text-neutral-500 hover:text-neutral-300 transition-colors underline"
              >
                Очистить историю проверенных
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
