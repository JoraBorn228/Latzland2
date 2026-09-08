import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { AdminBar } from './components/AdminBar';
import { TimelineControls } from './components/TimelineControls';
import { TimelineItem } from './components/TimelineItem';
import { CompactTimelineItem } from './components/CompactTimelineItem';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AddEventModal } from './components/AddEventModal';
import { EditEventModal } from './components/EditEventModal';
import { ImportJsonModal } from './components/ImportJsonModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PlayersModal } from './components/PlayersModal';
import { ServerStatusBar } from './components/ServerStatusBar';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { WorldMapModal } from './components/WorldMapModal';
import { NetherCalculatorModal } from './components/NetherCalculatorModal';
import { DiscordPostExportModal } from './components/DiscordPostExportModal';
import { HallOfFameModal } from './components/HallOfFameModal';
import { ProjectsCatalogModal } from './components/ProjectsCatalogModal';
import { ModerationModal } from './components/ModerationModal';
import { PlayerCabinetModal } from './components/PlayerCabinetModal';
import { VisitorAnalyticsModal } from './components/VisitorAnalyticsModal';
import { TimelineScrubber } from './components/TimelineScrubber';
import { Toast } from './components/Toast';
import {
  EventType,
  LatzEvent,
  PlayerProfile,
  MegaProject,
  ProposalItem,
  TimelineViewMode,
  ServerAnalyticsData,
} from './types';
import { useServerStatus } from './utils/useServerStatus';
import {
  apiEvents,
  apiPlayers,
  apiProjects,
  apiProposals,
  apiServerAnalytics,
  apiAdmin,
  apiVisitorTracker,
} from './utils/api';
import { SearchX, RotateCcw, Plus, ShieldCheck, Inbox, User } from 'lucide-react';
import { validateAdminSession, destroyAdminSession, logSecurityAudit } from './utils/security';

// Только личные настройки браузера остаются в localStorage
const ADMIN_STORAGE_KEY = 'latzland_admin_active_v1';
const ACTIVE_PLAYER_STORAGE_KEY = 'latzland_active_player_nick_v1';
const VIEW_MODE_STORAGE_KEY = 'latzland_timeline_view_mode_v1';

export default function App() {
  // Active logged-in player nickname in Cabinet
  const [activePlayerNick, setActivePlayerNick] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_PLAYER_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Save active player nick
  useEffect(() => {
    try {
      if (activePlayerNick) {
        localStorage.setItem(ACTIVE_PLAYER_STORAGE_KEY, activePlayerNick);
      } else {
        localStorage.removeItem(ACTIVE_PLAYER_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error saving active player nick:', err);
    }
  }, [activePlayerNick]);
  // ── Shared data from server ──────────────────────────────────────────────
  const [events, setEvents] = useState<LatzEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [projects, setProjects] = useState<MegaProject[]>([]);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [serverAnalytics, setServerAnalytics] = useState<ServerAnalyticsData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Загрузка всех данных с сервера при старте
  const loadAllData = useCallback(async () => {
    try {
      setDataLoading(true);
      setDataError(null);
      const [evs, pls, prjs, props, analytics] = await Promise.all([
        apiEvents.getAll(),
        apiPlayers.getAll(),
        apiProjects.getAll(),
        apiProposals.getAll(),
        apiServerAnalytics.get().catch(() => null),
      ]);
      setEvents(evs);
      setPlayers(pls);
      setProjects(prjs);
      setProposals(props);
      if (analytics) setServerAnalytics(analytics);
    } catch (err) {
      console.error('Ошибка загрузки данных с сервера:', err);
      setDataError('Не удалось загрузить данные с сервера. Проверьте соединение.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Периодическое обновление аналитики и списка игроков
  const refreshAnalyticsAndPlayers = useCallback(async () => {
    try {
      const [analytics, freshPlayers] = await Promise.all([
        apiServerAnalytics.poll().catch(() => null),
        apiPlayers.getAll().catch(() => null),
      ]);
      if (analytics) setServerAnalytics(analytics);
      if (freshPlayers) setPlayers(freshPlayers);
    } catch (err) {
      console.warn('Analytics background poll error:', err);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(refreshAnalyticsAndPlayers, 60000); // 1 minute auto-sync
    return () => clearInterval(timer);
  }, [refreshAnalyticsAndPlayers]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Admin Mode state with cryptographic session verification
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const isSet = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
      if (!isSet) return false;
      return true;
    } catch {
      return false;
    }
  });

  // Verify session integrity on mount and periodically
  useEffect(() => {
    const checkSession = async () => {
      if (isAdmin) {
        const isValid = await validateAdminSession();
        if (!isValid) {
          setIsAdmin(false);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
    };
    checkSession();
    const interval = setInterval(checkSession, 60000); // Heartbeat every 60s
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Save admin state
  useEffect(() => {
    try {
      if (isAdmin) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        destroyAdminSession();
      }
    } catch (err) {
      console.error('Error saving admin state:', err);
    }
  }, [isAdmin]);



  // Filtering & sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<EventType | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');
  const [onlyImportant, setOnlyImportant] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<TimelineViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_MODE_STORAGE_KEY) as TimelineViewMode) || 'detailed';
    } catch {
      return 'detailed';
    }
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Save viewMode preference
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch (err) {
      console.error('Error saving viewMode preference:', err);
    }
  }, [viewMode]);

  // Live Minecraft Server Status (play.latzland.eu - 26.2 Java)
  const { status: serverStatus, refresh: refreshServerStatus } = useServerStatus(45000);

  // Accordion Expand/Collapse All state
  const [allExpandedState, setAllExpandedState] = useState<boolean | null>(null);

  // Modals & Toast
  const [isPlayerCabinetOpen, setIsPlayerCabinetOpen] = useState(false);
  const [prefilledAuthorNick, setPrefilledAuthorNick] = useState<string>('');
  const [projectModalInitialOpenAdd, setProjectModalInitialOpenAdd] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<string | null>(null);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
  const [isNetherCalcOpen, setIsNetherCalcOpen] = useState(false);
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [isProjectsCatalogOpen, setIsProjectsCatalogOpen] = useState(false);
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [isVisitorAnalyticsOpen, setIsVisitorAnalyticsOpen] = useState(false);
  const [discordExportEvent, setDiscordExportEvent] = useState<LatzEvent | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const [branchingParentEvent, setBranchingParentEvent] = useState<LatzEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<LatzEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Background Visitor Tracking ping
  useEffect(() => {
    apiVisitorTracker.track({
      path: window.location.pathname + window.location.hash,
      referrer: document.referrer,
      playerNick: activePlayerNick || undefined,
    });
  }, [activePlayerNick]);

  // Pending proposals counter
  const pendingProposalsCount = useMemo(() => {
    return proposals.filter((p) => p.status === 'pending').length;
  }, [proposals]);

  // Current active player proposals count
  const myProposalsCount = useMemo(() => {
    if (!activePlayerNick) return 0;
    return proposals.filter(
      (p) => p.submittedBy.toLowerCase() === activePlayerNick.toLowerCase()
    ).length;
  }, [proposals, activePlayerNick]);

  const handleDeleteMyProposal = async (proposalId: string) => {
    await apiProposals.delete(proposalId);
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
  };

  const handleUpdatePlayerProfile = async (updatedProfile: PlayerProfile) => {
    await apiPlayers.save(updatedProfile);
    setPlayers((prev) => {
      const idx = prev.findIndex(
        (p) => p.username.toLowerCase() === updatedProfile.username.toLowerCase()
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedProfile };
        return next;
      }
      return [...prev, updatedProfile];
    });
  };

  const handleAddNewPlayerToDb = async (newPlayer: PlayerProfile) => {
    const exists = players.some(
      (p) => p.username.toLowerCase() === newPlayer.username.toLowerCase()
    );
    if (exists) return;
    await apiPlayers.save(newPlayer);
    setPlayers((prev) => [...prev, newPlayer]);
    setToastMessage(`Игрок ${newPlayer.username} добавлен в базу`);
  };

  const handleCreateBranch = (parentEvent: LatzEvent) => {
    setBranchingParentEvent(parentEvent);
    setIsAddModalOpen(true);
  };

  // Available seasons
  const availableSeasons = useMemo(() => {
    const seasons = new Set<number>();
    events.forEach((e) => {
      if (e.season) seasons.add(e.season);
    });
    return Array.from(seasons).sort((a, b) => a - b);
  }, [events]);

  // Available storyline branches
  const availableBranches = useMemo(() => {
    const branches = new Set<string>();
    events.forEach((e) => {
      if (e.branchName && e.branchName.trim()) {
        branches.add(e.branchName.trim());
      }
    });
    return Array.from(branches).sort();
  }, [events]);

  // Jump to specific event by id and scroll smoothly
  const handleJumpToEvent = (id: string) => {
    // Reset filters to ensure the event is visible
    setSearchQuery('');
    setActiveType('all');
    setSelectedSeason('all');
    setSelectedBranch('all');
    setOnlyImportant(false);

    setTimeout(() => {
      const el = document.getElementById(`event-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-[#00e676]', 'ring-offset-4', 'ring-offset-[#0c0c0c]');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#00e676]', 'ring-offset-4', 'ring-offset-[#0c0c0c]');
        }, 2800);
      }
    }, 100);
  };

  const handleJumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = ev.title.toLowerCase().includes(query);
          const matchDesc = ev.description?.toLowerCase().includes(query) ?? false;
          const matchDate = ev.date.includes(query);
          const matchPlayers =
            ev.players?.some((p) => p.toLowerCase().includes(query)) ?? false;
          const matchBranch =
            ev.branchName?.toLowerCase().includes(query) ?? false;

          if (!matchTitle && !matchDesc && !matchDate && !matchPlayers && !matchBranch) {
            return false;
          }
        }

        // Type filter
        if (activeType !== 'all' && ev.type !== activeType) {
          return false;
        }

        // Season filter
        if (selectedSeason !== 'all' && ev.season !== selectedSeason) {
          return false;
        }

        // Story Branch filter
        if (selectedBranch !== 'all' && ev.branchName !== selectedBranch) {
          return false;
        }

        // Important only filter
        if (onlyImportant && !ev.important) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [events, activeType, selectedSeason, selectedBranch, onlyImportant, searchQuery, sortOrder]);

  // Direct Admin Event Addition
  const handleAddEvent = async (newEvent: LatzEvent) => {
    try {
      await apiEvents.add(newEvent);
      setEvents((prev) => [newEvent, ...prev]);
      setToastMessage(`Событие «${newEvent.title}» опубликовано в таймлайн!`);
    } catch (err) {
      console.error('Failed to add event:', err);
      // Even if API threw an error, keep UI state updated locally
      setEvents((prev) => [newEvent, ...prev]);
      setToastMessage(`Событие «${newEvent.title}» добавлено!`);
    }
  };

  // Player Event Proposal
  const handleSubmitEventProposal = async (proposal: {
    eventData: LatzEvent;
    submittedBy: string;
    userComment?: string;
  }) => {
    const author = proposal.submittedBy?.trim() || activePlayerNick || 'Игрок';
    const newProposal: ProposalItem = {
      id: `prop-${Date.now()}`,
      type: 'event',
      submittedAt: new Date().toISOString(),
      submittedBy: author,
      userComment: proposal.userComment,
      status: 'pending',
      eventData: {
        ...proposal.eventData,
        players: proposal.eventData.players && proposal.eventData.players.length > 0
          ? proposal.eventData.players
          : [author],
      },
    };
    try {
      await apiProposals.add(newProposal);
    } catch (err) {
      console.error('Failed to submit proposal to server:', err);
    }
    setProposals((prev) => [newProposal, ...prev]);
  };

  // Direct Admin Project Addition
  const handleAddProject = async (newProject: MegaProject) => {
    try {
      await apiProjects.add(newProject);
    } catch (err) {
      console.error('Failed to add project to server:', err);
    }
    setProjects((prev) => [newProject, ...prev]);
  };

  // Admin Project Deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      await apiProjects.delete(projectId);
    } catch (err) {
      console.error('Failed to delete project on server:', err);
    }
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setToastMessage('Постройка успешно удалена из каталога!');
  };

  // Player Project Proposal
  const handleSubmitProjectProposal = async (proposal: {
    projectData: MegaProject;
    submittedBy: string;
    userComment?: string;
  }) => {
    const author = proposal.submittedBy?.trim() || activePlayerNick || 'Игрок';
    const newProposal: ProposalItem = {
      id: `prop-${Date.now()}`,
      type: 'project',
      submittedAt: new Date().toISOString(),
      submittedBy: author,
      userComment: proposal.userComment,
      status: 'pending',
      projectData: proposal.projectData,
    };
    try {
      await apiProposals.add(newProposal);
    } catch (err) {
      console.error('Failed to submit project proposal to server:', err);
    }
    setProposals((prev) => [newProposal, ...prev]);
  };

  // Moderation Approval / Rejection / Deletion
  const handleApproveEventProposal = async (proposalId: string, eventData: LatzEvent) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      const updated = { ...proposal, status: 'approved' as const };
      try {
        await apiProposals.update(updated);
      } catch (err) {
        console.error('Failed to update proposal status on server:', err);
      }
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
    }
    if (!events.some((e) => e.id === eventData.id)) {
      try {
        await apiEvents.add(eventData);
      } catch (err) {
        console.error('Failed to publish approved event to server:', err);
      }
      setEvents((prev) => [eventData, ...prev]);
    }
    setToastMessage(`Событие «${eventData.title}» одобрено и опубликовано в таймлайн!`);
  };

  const handleApproveProjectProposal = async (proposalId: string, projectData: MegaProject) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      const updated = { ...proposal, status: 'approved' as const };
      try {
        await apiProposals.update(updated);
      } catch (err) {
        console.error('Failed to update project proposal status on server:', err);
      }
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
    }
    if (!projects.some((p) => p.id === projectData.id)) {
      try {
        await apiProjects.add(projectData);
      } catch (err) {
        console.error('Failed to save approved project to server:', err);
      }
      setProjects((prev) => [projectData, ...prev]);
    }
    setToastMessage(`Проект «${projectData.title}» одобрен и добавлен в каталог строек!`);
  };

  const handleRejectProposal = async (proposalId: string, reason?: string) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      const updated = { ...proposal, status: 'rejected' as const, rejectReason: reason };
      try {
        await apiProposals.update(updated);
      } catch (err) {
        console.error('Failed to update rejected proposal on server:', err);
      }
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
    }
    setToastMessage(`Заявка отклонена ${reason ? `(Причина: ${reason})` : ''}`);
  };

  const handleDeleteProposal = async (proposalId: string) => {
    try {
      await apiProposals.delete(proposalId);
    } catch (err) {
      console.error('Failed to delete proposal on server:', err);
    }
    setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    setToastMessage('Заявка удалена из базы');
  };

  const handleRestoreProposal = async (proposalId: string) => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (proposal) {
      const updated = { ...proposal, status: 'pending' as const, rejectReason: undefined };
      try {
        await apiProposals.update(updated);
      } catch (err) {
        console.error('Failed to restore proposal on server:', err);
      }
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? updated : p)));
    }
    setToastMessage('Заявка возвращена в очередь на проверку');
  };

  const handleClearProposalHistory = async () => {
    try {
      await apiProposals.clearHistory();
    } catch (err) {
      console.error('Failed to clear proposal history on server:', err);
    }
    setProposals((prev) => prev.filter((p) => p.status === 'pending'));
    setToastMessage('История проверенных заявок очищена');
  };

  const handleSaveEditedEvent = async (updated: LatzEvent) => {
    try {
      await apiEvents.update(updated);
    } catch (err) {
      console.error('Failed to save edited event on server:', err);
    }
    setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
    setToastMessage(`Изменения в событии «${updated.title}» сохранены!`);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await apiEvents.delete(id);
    } catch (err) {
      console.error('Failed to delete event on server:', err);
    }
    // Очищаем ссылки на удалённое событие как родителя
    const orphaned = events.filter((ev) => ev.parentId === id);
    for (const ev of orphaned) {
      const fixed = { ...ev, parentId: undefined, branchName: undefined };
      try {
        await apiEvents.update(fixed);
      } catch (err) {
        console.error('Failed to fix orphaned event:', err);
      }
    }
    setEvents((prev) =>
      prev
        .filter((ev) => ev.id !== id)
        .map((ev) =>
          ev.parentId === id ? { ...ev, parentId: undefined, branchName: undefined } : ev
        )
    );
    setToastMessage('Событие удалено из хронологии');
  };

  const handleToggleImportant = async (id: string) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const updated = { ...target, important: !target.important };
    await apiEvents.update(updated);
    setEvents((prev) => prev.map((ev) => (ev.id === id ? updated : ev)));
    setToastMessage(
      target.important
        ? `Снята отметка важности: «${target.title}»`
        : `Отмечено как важное: «${target.title}»`
    );
  };

  const handleDuplicateEvent = async (cloned: LatzEvent) => {
    await apiEvents.add(cloned);
    setEvents((prev) => [cloned, ...prev]);
  };

  const handleImportEvents = async (newEvents: LatzEvent[], mode: 'replace' | 'merge') => {
    const result = await apiEvents.importAll(newEvents, mode);
    setEvents(result);
  };

  const handleResetToDefault = async () => {
    const result = await apiEvents.reset();
    setEvents(result);
    setToastMessage('База событий сброшена к исходным данным');
  };

  const handleToggleAdmin = () => {
    if (isAdmin) {
      destroyAdminSession();
      apiAdmin.logout();
      setIsAdmin(false);
      setToastMessage('Режим администратора отключён');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleExpandAll = () => {
    setAllExpandedState(true);
  };

  const handleCollapseAll = () => {
    setAllExpandedState(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveType('all');
    setSelectedSeason('all');
    setOnlyImportant(false);
    setSelectedBranch('all');
  };

  // Экран загрузки при первом подключении к серверу
  if (dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-[#e8e8e8] gap-4">
        <div className="w-10 h-10 border-2 border-[#00e676] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Загрузка данных с сервера…</p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-[#e8e8e8] gap-4 px-6">
        <p className="text-red-400 text-sm text-center">{dataError}</p>
        <button
          onClick={loadAllData}
          className="px-4 py-2 rounded-lg bg-[#00e676] text-black text-sm font-semibold hover:bg-[#00c853] transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0c] text-[#e8e8e8] w-full max-w-full overflow-x-hidden selection:bg-[#00e676]/30 selection:text-white">
      {/* Sticky Header */}
      <Header
        isAdmin={isAdmin}
        activePlayerNick={activePlayerNick}
        serverStatus={serverStatus}
        pendingProposalsCount={pendingProposalsCount}
        myProposalsCount={myProposalsCount}
        onToggleAdmin={handleToggleAdmin}
        onOpenPlayerCabinet={() => setIsPlayerCabinetOpen(true)}
        onOpenAddModal={() => {
          setBranchingParentEvent(null);
          setPrefilledAuthorNick(activePlayerNick || '');
          setIsAddModalOpen(true);
        }}
        onOpenPlayersModal={() => setIsPlayersModalOpen(true)}
        onOpenWorldMap={() => setIsWorldMapOpen(true)}
        onOpenNetherCalc={() => setIsNetherCalcOpen(true)}
        onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
        onOpenProjectsCatalog={() => {
          setPrefilledAuthorNick(activePlayerNick || '');
          setProjectModalInitialOpenAdd(false);
          setIsProjectsCatalogOpen(true);
        }}
        onOpenModerationModal={() => setIsModerationOpen(true)}
        onShowToast={(msg) => setToastMessage(msg)}
        onFocusSearch={() => {
          searchInputRef.current?.focus();
          window.scrollTo({ top: 150, behavior: 'smooth' });
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-24 md:pb-12">
        {/* Page Hero Title */}
        <div className="text-center mb-6 pt-1">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2.5 bg-gradient-to-r from-white via-neutral-100 to-[#00e676] bg-clip-text text-transparent">
            Хронология сервера
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Все ключевые события LatzLand SMP — от первой заложенной хижины до великих строек, войн и совместных побед
          </p>
        </div>

        {/* Live Minecraft Server Status Card with Analytics & Hourly Graph */}
        <ServerStatusBar
          status={serverStatus}
          analytics={serverAnalytics || undefined}
          playersDatabase={players}
          onRefresh={async () => {
            refreshServerStatus();
            await refreshAnalyticsAndPlayers();
          }}
          onSelectPlayer={(nick) => setSearchQuery(nick)}
          onOpenPlayerProfile={(nick) => setSelectedPlayerProfile(nick)}
          onOpenPlayersModal={() => setIsPlayersModalOpen(true)}
          onShowToast={(msg) => setToastMessage(msg)}
        />

        {/* Dynamic Stats Bar */}
        <StatsBar events={events} />

        {/* Admin Bar shown when admin mode is active */}
        {isAdmin && (
          <AdminBar
            events={events}
            onOpenAddModal={() => {
              setBranchingParentEvent(null);
              setIsAddModalOpen(true);
            }}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onOpenPlayersModal={() => setIsPlayersModalOpen(true)}
            onOpenVisitorAnalytics={() => setIsVisitorAnalyticsOpen(true)}
            onResetToDefault={handleResetToDefault}
            onExitAdmin={() => {
              destroyAdminSession();
              apiAdmin.logout();
              setIsAdmin(false);
              setToastMessage('Вы вышли из режима администратора');
            }}
          />
        )}

        {/* Filters, Search & View Controls */}
        <TimelineControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeType={activeType}
          setActiveType={setActiveType}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          availableSeasons={availableSeasons}
          onlyImportant={onlyImportant}
          setOnlyImportant={setOnlyImportant}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          events={events}
          filteredCount={filteredEvents.length}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          allExpandedState={allExpandedState}
          onOpenWorldMap={() => setIsWorldMapOpen(true)}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          availableBranches={availableBranches}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchInputRef={searchInputRef}
        />

        {/* Timeline Stream */}
        <div className="relative pb-12">
          {filteredEvents.length > 0 ? (
            viewMode === 'detailed' ? (
              <div className="relative">
                {/* Vertical connecting line with emerald gradient */}
                <div className="absolute left-[20px] sm:left-[24px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-[#00e676] via-[#00e676]/25 to-transparent pointer-events-none" />
                <div>
                  {filteredEvents.map((ev, index) => (
                    <TimelineItem
                      key={ev.id}
                      event={ev}
                      isInitiallyOpen={
                        allExpandedState !== null ? allExpandedState : index === 0
                      }
                      isAdmin={isAdmin}
                      onEdit={(eventToEdit) => setEditingEvent(eventToEdit)}
                      onDelete={handleDeleteEvent}
                      onToggleImportant={handleToggleImportant}
                      onShowToast={(msg) => setToastMessage(msg)}
                      onOpenPlayerProfile={(nick) => setSelectedPlayerProfile(nick)}
                      onShareDiscord={(event) => setDiscordExportEvent(event)}
                      onCreateBranch={handleCreateBranch}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Compact view list */
              <div className="space-y-1.5 animate-in fade-in">
                {filteredEvents.map((ev) => (
                  <CompactTimelineItem
                    key={ev.id}
                    event={ev}
                    isAdmin={isAdmin}
                    onEdit={(eventToEdit) => setEditingEvent(eventToEdit)}
                    onDelete={handleDeleteEvent}
                    onToggleImportant={handleToggleImportant}
                    onShowToast={(msg) => setToastMessage(msg)}
                    onSelectPlayer={(nick) => setSelectedPlayerProfile(nick)}
                    onOpenDiscordExport={(event) => setDiscordExportEvent(event)}
                    onOpenWorldMap={() => setIsWorldMapOpen(true)}
                    onOpenNetherCalc={() => setIsNetherCalcOpen(true)}
                    onSelectBranch={(branchName) => setSelectedBranch(branchName)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="p-8 my-6 text-center bg-[#141414] border border-white/5 rounded-2xl">
              <SearchX className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                События не найдены
              </h3>
              <p className="text-xs text-neutral-400 mb-4 max-w-md mx-auto">
                Попробуйте изменить параметры поиска или сбросить фильтры
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить фильтры</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#00e676] hover:bg-[#00c853] text-black transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAdmin ? 'Добавить событие' : 'Предложить событие'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0e0e0e] py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="text-xs text-neutral-400">
            <span className="font-semibold text-white">LatzLand SMP</span> © {new Date().getFullYear()} — Хроника и история сервера
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1.5 text-neutral-400 text-[11px]">
            <span>Minecraft 26.2</span>
            <span>•</span>
            <button
              onClick={() => setIsPlayerCabinetOpen(true)}
              className="hover:text-cyan-300 text-cyan-400/90 font-medium transition-colors underline underline-offset-2 flex items-center gap-1"
            >
              <User className="w-3 h-3 text-cyan-400" />
              <span>Личный кабинет {activePlayerNick ? `(@${activePlayerNick})` : ''}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsPlayersModalOpen(true)}
              className="hover:text-cyan-400 transition-colors underline underline-offset-2"
            >
              База игроков ({players.length})
            </button>
            <span>•</span>
            <button
              onClick={() => setIsProjectsCatalogOpen(true)}
              className="hover:text-emerald-400 transition-colors underline underline-offset-2"
            >
              Стройки ({projects.length})
            </button>
            {isAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={() => setIsModerationOpen(true)}
                  className="hover:text-amber-400 text-amber-300 font-bold transition-colors flex items-center gap-1"
                >
                  <Inbox className="w-3 h-3 text-amber-400" />
                  <span>Предложка ({pendingProposalsCount})</span>
                </button>
              </>
            )}
            <span>•</span>
            <button
              onClick={handleToggleAdmin}
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-amber-500" />
              <span>{isAdmin ? 'Админка (активна)' : 'Вход в админку'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Add / Propose Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setBranchingParentEvent(null);
          setPrefilledAuthorNick('');
        }}
        isAdmin={isAdmin}
        initialAuthorNick={prefilledAuthorNick || activePlayerNick || ''}
        onAddEvent={handleAddEvent}
        onSubmitEventProposal={handleSubmitEventProposal}
        onShowToast={(msg) => setToastMessage(msg)}
        availablePlayers={players}
        onAddNewPlayerToDb={handleAddNewPlayerToDb}
        onOpenPlayerManager={() => setIsPlayersModalOpen(true)}
        allEvents={events}
        initialParentEvent={branchingParentEvent}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={Boolean(editingEvent)}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSaveEvent={handleSaveEditedEvent}
        onDeleteEvent={handleDeleteEvent}
        onDuplicateEvent={handleDuplicateEvent}
        onShowToast={(msg) => setToastMessage(msg)}
        availablePlayers={players}
        onAddNewPlayerToDb={handleAddNewPlayerToDb}
        onOpenPlayerManager={() => setIsPlayersModalOpen(true)}
        allEvents={events}
      />

      {/* Moderation / Proposal Queue Modal (Admin) */}
      <ModerationModal
        isOpen={isModerationOpen}
        onClose={() => setIsModerationOpen(false)}
        proposals={proposals}
        onApproveEvent={handleApproveEventProposal}
        onApproveProject={handleApproveProjectProposal}
        onRejectProposal={handleRejectProposal}
        onDeleteProposal={handleDeleteProposal}
        onRestoreProposal={handleRestoreProposal}
        onClearHistory={handleClearProposalHistory}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Players Central Database Modal */}
      <PlayersModal
        isOpen={isPlayersModalOpen}
        onClose={() => setIsPlayersModalOpen(false)}
        players={players}
        events={events}
        onFilterByPlayer={(nick) => setSearchQuery(nick)}
        onAddPlayer={async (newPlayer) => {
          await apiPlayers.save(newPlayer);
          setPlayers((prev) => [...prev, newPlayer]);
        }}
        onUpdatePlayer={async (updatedPlayer) => {
          await apiPlayers.save(updatedPlayer);
          setPlayers((prev) =>
            prev.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p))
          );
        }}
        onDeletePlayer={async (id) => {
          await apiPlayers.delete(id);
          setPlayers((prev) => prev.filter((p) => p.id !== id));
        }}
        onSavePlayers={async (newPlayers) => {
          // Массовое обновление: сохраняем каждого
          await Promise.all(newPlayers.map((p) => apiPlayers.save(p)));
          setPlayers(newPlayers);
          setToastMessage('База игроков успешно обновлена');
        }}
        isAdmin={isAdmin}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Import JSON Modal */}
      <ImportJsonModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportEvents={handleImportEvents}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* 2D Interactive World Map Modal */}
      <WorldMapModal
        isOpen={isWorldMapOpen}
        onClose={() => setIsWorldMapOpen(false)}
        events={events}
        onSelectEvent={(id) => handleJumpToEvent(id)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Nether Calculator (8:1) and Highway Navigator Modal */}
      <NetherCalculatorModal
        isOpen={isNetherCalcOpen}
        onClose={() => setIsNetherCalcOpen(false)}
        events={events}
        onSelectEvent={(id) => handleJumpToEvent(id)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Discord Post Export Modal */}
      <DiscordPostExportModal
        event={discordExportEvent}
        isOpen={Boolean(discordExportEvent)}
        onClose={() => setDiscordExportEvent(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Hall of Fame & Achievements Modal */}
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
        players={players}
        events={events}
        isAdmin={isAdmin}
        onUpdatePlayerProfile={handleUpdatePlayerProfile}
        onOpenPlayerProfile={(nick) => {
          setSelectedPlayerProfile(nick);
        }}
        onFilterByPlayer={(nick) => {
          setSearchQuery(nick);
        }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Mega Projects & Builds Catalog Modal */}
      <ProjectsCatalogModal
        isOpen={isProjectsCatalogOpen}
        onClose={() => {
          setIsProjectsCatalogOpen(false);
          setProjectModalInitialOpenAdd(false);
          setPrefilledAuthorNick('');
        }}
        projects={projects}
        events={events}
        players={players}
        isAdmin={isAdmin}
        initialAuthorNick={prefilledAuthorNick || activePlayerNick || ''}
        initialOpenAdd={projectModalInitialOpenAdd}
        onSelectEvent={(id) => handleJumpToEvent(id)}
        onSelectPlayer={(nick) => {
          setSelectedPlayerProfile(nick);
        }}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onSubmitProjectProposal={handleSubmitProjectProposal}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Player Personal Cabinet & Proposal Statuses Modal */}
      <PlayerCabinetModal
        isOpen={isPlayerCabinetOpen}
        onClose={() => setIsPlayerCabinetOpen(false)}
        activePlayerNick={activePlayerNick}
        onSetActivePlayerNick={(nick) => setActivePlayerNick(nick)}
        proposals={proposals}
        events={events}
        projects={projects}
        playersDatabase={players}
        serverStatus={serverStatus}
        onDeleteMyProposal={handleDeleteMyProposal}
        onOpenAddEventProposal={(nick) => {
          setPrefilledAuthorNick(nick);
          setIsAddModalOpen(true);
        }}
        onOpenAddProjectProposal={(nick) => {
          setPrefilledAuthorNick(nick);
          setProjectModalInitialOpenAdd(true);
          setIsProjectsCatalogOpen(true);
        }}
        onJumpToEvent={(id) => handleJumpToEvent(id)}
        onJumpToProject={(id) => {
          setIsProjectsCatalogOpen(true);
        }}
        onUpdatePlayerProfile={handleUpdatePlayerProfile}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Player Passport & Profile Modal */}
      <PlayerProfileModal
        username={selectedPlayerProfile || ''}
        isOpen={Boolean(selectedPlayerProfile)}
        onClose={() => setSelectedPlayerProfile(null)}
        events={events}
        playersDatabase={players}
        serverStatus={serverStatus}
        isAdmin={isAdmin}
        onUpdatePlayerProfile={handleUpdatePlayerProfile}
        onFilterByPlayer={(nick) => {
          setSearchQuery(nick);
          setSelectedPlayerProfile(null);
        }}
        onJumpToEvent={(id) => {
          handleJumpToEvent(id);
          setSelectedPlayerProfile(null);
        }}
        onShowToast={(msg) => setToastMessage(msg)}
      />

      {/* Admin Web Visitor Analytics Modal */}
      <VisitorAnalyticsModal
        isOpen={isVisitorAnalyticsOpen}
        onClose={() => setIsVisitorAnalyticsOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Floating Timeline Quick Scrubber Navigation */}
      <TimelineScrubber
        events={filteredEvents}
        onJumpToEvent={handleJumpToEvent}
        onJumpToTop={handleJumpToTop}
        onJumpToBottom={handleJumpToBottom}
      />

      {/* Dedicated Mobile Bottom Ergonomic Navigation */}
      <MobileBottomNav
        activePlayerNick={activePlayerNick}
        isAdmin={isAdmin}
        pendingProposalsCount={pendingProposalsCount}
        onOpenAddModal={() => {
          setBranchingParentEvent(null);
          setPrefilledAuthorNick(activePlayerNick || '');
          setIsAddModalOpen(true);
        }}
        onOpenProjects={() => {
          setPrefilledAuthorNick(activePlayerNick || '');
          setProjectModalInitialOpenAdd(false);
          setIsProjectsCatalogOpen(true);
        }}
        onOpenWorldMap={() => setIsWorldMapOpen(true)}
        onOpenCabinet={() => setIsPlayerCabinetOpen(true)}
        onOpenModeration={() => setIsModerationOpen(true)}
        onOpenTimeline={handleJumpToTop}
      />

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
