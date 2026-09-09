import React, { useState, useMemo } from 'react';
import {
  Hammer,
  X,
  Search,
  ExternalLink,
  MapPin,
  Users,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Flame,
  Globe,
  SlidersHorizontal,
  Plus,
  Copy,
  Check,
  Building,
  Cpu,
  Swords,
  Landmark,
  Trash2,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { MegaProject, ProjectStatus, LatzEvent, PlayerProfile } from '../types';
import { sanitizeText, validateCoordinates } from '../utils/sanitizer';

interface ProjectsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: MegaProject[];
  events: LatzEvent[];
  players: PlayerProfile[];
  isAdmin: boolean;
  initialAuthorNick?: string;
  initialOpenAdd?: boolean;
  onSelectEvent?: (eventId: string) => void;
  onSelectPlayer?: (username: string) => void;
  onAddProject?: (newProject: MegaProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onSubmitProjectProposal?: (proposal: {
    projectData: MegaProject;
    submittedBy: string;
    userComment?: string;
  }) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  spawn: { label: 'Спавн и Центр', icon: Landmark, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  infrastructure: { label: 'Инфраструктура', icon: Compass, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  mega_base: { label: 'Мега-Базы', icon: Building, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  farm: { label: 'Фермы & Заводы', icon: Cpu, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  pvp_arena: { label: 'PvP Арены', icon: Swords, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  monument: { label: 'Монументы', icon: Sparkles, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
};

const STATUS_MAP: Record<ProjectStatus, { label: string; badgeClass: string; barColor: string }> = {
  completed: {
    label: 'Завершено',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    barColor: 'bg-[#00e676]',
  },
  in_progress: {
    label: 'В процессе',
    badgeClass: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
    barColor: 'bg-amber-400',
  },
  planned: {
    label: 'Планируется',
    badgeClass: 'bg-blue-500/15 border-blue-500/35 text-blue-300',
    barColor: 'bg-blue-400',
  },
  paused: {
    label: 'Заморожено',
    badgeClass: 'bg-neutral-500/15 border-neutral-500/35 text-neutral-400',
    barColor: 'bg-neutral-500',
  },
};

export const ProjectsCatalogModal: React.FC<ProjectsCatalogModalProps> = ({
  isOpen,
  onClose,
  projects,
  events,
  players,
  isAdmin,
  initialAuthorNick = '',
  initialOpenAdd = false,
  onSelectEvent,
  onSelectPlayer,
  onAddProject,
  onDeleteProject,
  onSubmitProjectProposal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<MegaProject | null>(null);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<MegaProject['category']>('mega_base');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('in_progress');
  const [newProgress, setNewProgress] = useState(50);
  const [newBuilders, setNewBuilders] = useState('');
  const [newCoordX, setNewCoordX] = useState('0');
  const [newCoordY, setNewCoordY] = useState('70');
  const [newCoordZ, setNewCoordZ] = useState('0');
  const [newDimension, setNewDimension] = useState<'overworld' | 'nether' | 'the_end'>('overworld');
  const [newSeason, setNewSeason] = useState(2);
  const [newMaterials, setNewMaterials] = useState('');
  const [submitterNick, setSubmitterNick] = useState('');
  const [submitterComment, setSubmitterComment] = useState('');

  // Sync initial author nick or auto-open add form
  React.useEffect(() => {
    if (isOpen) {
      if (initialOpenAdd) {
        setIsAddFormOpen(true);
      }
      if (initialAuthorNick) {
        setSubmitterNick(initialAuthorNick);
        if (!newBuilders) {
          setNewBuilders(initialAuthorNick);
        }
      }
    }
  }, [isOpen, initialOpenAdd, initialAuthorNick]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((proj) => {
      const matchesSearch =
        proj.title.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q) ||
        proj.builders.some((b) => b.toLowerCase().includes(q)) ||
        (proj.materials && proj.materials.some((m) => m.toLowerCase().includes(q)));

      if (!matchesSearch) return false;
      if (selectedCategory !== 'all' && proj.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && proj.status !== selectedStatus) return false;
      if (selectedDimension !== 'all' && (proj.coordinates.dimension || 'overworld') !== selectedDimension) {
        return false;
      }

      return true;
    });
  }, [projects, searchQuery, selectedCategory, selectedStatus, selectedDimension]);

  const handleCopyCoords = (proj: MegaProject) => {
    const text = `/tp @s ${proj.coordinates.x} ${proj.coordinates.y || 70} ${proj.coordinates.z}`;
    navigator.clipboard.writeText(text);
    onShowToast(`Команда телепортации скопирована: ${text}`);
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    onDeleteProject?.(projectToDelete.id);
    onShowToast(`Проект «${projectToDelete.title}» удалён!`);
    setProjectToDelete(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onShowToast('Введите название проекта');
      return;
    }

    const buildersList = newBuilders
      .split(',')
      .map((b) => sanitizeText(b))
      .filter(Boolean);

    const materialsList = newMaterials
      .split(',')
      .map((m) => sanitizeText(m))
      .filter(Boolean);

    const coords = validateCoordinates(newCoordX, newCoordY, newCoordZ);

    const created: MegaProject = {
      id: `proj-${Date.now()}`,
      title: sanitizeText(newTitle) || 'Новый проект',
      description: sanitizeText(newDescription) || '',
      category: newCategory,
      status: newStatus,
      progressPercent: Math.max(0, Math.min(100, Number(newProgress) || 0)),
      builders: buildersList.length > 0 ? buildersList : ['Игрок'],
      coordinates: {
        x: coords.valid ? coords.x : 0,
        y: coords.valid ? coords.y : 70,
        z: coords.valid ? coords.z : 0,
        dimension: newDimension,
      },
      season: Math.max(1, Math.min(20, newSeason)),
      materials: materialsList,
      features: ['Добавлен через каталог'],
    };

    if (isAdmin) {
      onAddProject?.(created);
      onShowToast(`Проект «${created.title}» успешно опубликован!`);
    } else {
      onSubmitProjectProposal?.({
        projectData: created,
        submittedBy: sanitizeText(submitterNick.trim()) || 'Игрок',
        userComment: sanitizeText(submitterComment.trim()) || undefined,
      });
      onShowToast(`Проект «${created.title}» отправлен в предложку на проверку администрации!`);
    }

    setIsAddFormOpen(false);

    // Reset fields
    setNewTitle('');
    setNewDescription('');
    setNewBuilders('');
    setNewMaterials('');
    setSubmitterNick('');
    setSubmitterComment('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#121212] border border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,230,118,0.15)] overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-b from-[#101c15] to-[#121212] border-b border-emerald-500/20 px-4 sm:px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,230,118,0.4)]">
                <Hammer className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-emerald-200 tracking-tight flex items-center gap-2">
                  <span>Каталог Мега-Проектов и Строек</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    {projects.length} объектов
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Архитектурные чудеса, базы, фермы и инфраструктура LatzLand
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddFormOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isAddFormOpen
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                }`}
              >
                {isAdmin ? <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Send className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isAdmin ? 'Добавить проект' : 'Предложить проект'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, строителю или материалам..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-neutral-300 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Все категории</option>
                <option value="spawn">Спавн и Ратуша</option>
                <option value="infrastructure">Инфраструктура</option>
                <option value="mega_base">Мега-Базы</option>
                <option value="farm">Фермы и Заводы</option>
                <option value="pvp_arena">PvP Арены</option>
              </select>

              {/* Status selector */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-neutral-300 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Все статусы</option>
                <option value="completed">Завершено (100%)</option>
                <option value="in_progress">В процессе</option>
                <option value="planned">Планируется</option>
              </select>

              {/* Dimension selector */}
              <select
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1 text-neutral-300 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Все измерения</option>
                <option value="overworld">Верхний мир</option>
                <option value="nether">Незер</option>
                <option value="the_end">Энд</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-neutral-200">
          
          {/* Delete confirmation modal */}
          {projectToDelete && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Удалить проект «{projectToDelete.title}»?
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Это действие удалит постройку из каталога проектов.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs text-white font-bold shadow-md"
                >
                  Да, удалить
                </button>
              </div>
            </div>
          )}

          {/* Add / Propose Project Form (Collapsible) */}
          {isAddFormOpen && (
            <form
              onSubmit={handleCreateProject}
              className="p-4 sm:p-5 rounded-2xl bg-[#171717] border border-emerald-500/40 space-y-3.5 shadow-lg animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  {isAdmin ? <Plus className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>
                    {isAdmin ? 'Добавить новый проект напрямую (Админ)' : 'Предложить новый проект (в предложку)'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Отмена
                </button>
              </div>

              {!isAdmin && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
                  💡 Ваша заявка попадет в предложку администрации и появится в общем каталоге после проверки.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Название проекта *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Незер-Хаб 8:1"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Категория</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="mega_base">Мега-База</option>
                    <option value="infrastructure">Инфраструктура</option>
                    <option value="spawn">Спавн и Центр</option>
                    <option value="farm">Ферма / Завод</option>
                    <option value="pvp_arena">PvP Арена</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">Описание постройки</label>
                  <textarea
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Кратко расскажите об архитектуре, назначении и масштабе..."
                    className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Строители (через запятую)</label>
                  <input
                    type="text"
                    value={newBuilders}
                    onChange={(e) => setNewBuilders(e.target.value)}
                    placeholder="Fr0gus, Alex_Miner"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Прогресс постройки ({newProgress}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newProgress}
                    onChange={(e) => setNewProgress(Number(e.target.value))}
                    className="w-full accent-[#00e676]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Координата X</label>
                    <input
                      type="number"
                      value={newCoordX}
                      onChange={(e) => setNewCoordX(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Y</label>
                    <input
                      type="number"
                      value={newCoordY}
                      onChange={(e) => setNewCoordY(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Z</label>
                    <input
                      type="number"
                      value={newCoordZ}
                      onChange={(e) => setNewCoordZ(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white text-center font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Измерение</label>
                  <select
                    value={newDimension}
                    onChange={(e) => setNewDimension(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="overworld">Верхний мир</option>
                    <option value="nether">Незер</option>
                    <option value="the_end">Энд</option>
                  </select>
                </div>

                {!isAdmin && (
                  <>
                    <div>
                      <label className="block text-neutral-400 mb-1">Ваш игровой ник *</label>
                      <input
                        type="text"
                        required
                        value={submitterNick}
                        onChange={(e) => setSubmitterNick(e.target.value)}
                        placeholder="Например: Fr0gus"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Комментарий для админа</label>
                      <input
                        type="text"
                        value={submitterComment}
                        onChange={(e) => setSubmitterComment(e.target.value)}
                        placeholder="Укажите подробности..."
                        className="w-full px-3 py-1.5 rounded-xl bg-[#121212] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
                >
                  {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isAdmin ? 'Опубликовать проект' : 'Отправить в предложку'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((proj) => {
              const catConfig = CATEGORY_MAP[proj.category] || CATEGORY_MAP.mega_base;
              const statusConfig = STATUS_MAP[proj.status] || STATUS_MAP.in_progress;
              const IconComp = catConfig.icon;
              const distFromSpawn = Math.round(
                Math.sqrt(proj.coordinates.x * proj.coordinates.x + proj.coordinates.z * proj.coordinates.z)
              );

              return (
                <div
                  key={proj.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#161616] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Top info */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${catConfig.color}`}>
                        <IconComp className="w-3 h-3" />
                        <span>{catConfig.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfig.badgeClass}`}>
                          {statusConfig.label} ({proj.progressPercent}%)
                        </span>

                        {(isAdmin || (initialAuthorNick && proj.builders.some((b) => b.toLowerCase() === initialAuthorNick.toLowerCase()))) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(proj);
                            }}
                            className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-colors"
                            title="Удалить постройку"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                      {proj.title}
                    </h3>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Готовность проекта</span>
                        <span>{proj.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${statusConfig.barColor}`}
                          style={{ width: `${proj.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Materials chips */}
                    {proj.materials && proj.materials.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.materials.map((mat, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-neutral-400 font-medium"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom details & Actions */}
                  <div className="space-y-3 pt-3 border-t border-white/5 text-xs">
                    {/* Builders */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <div className="flex items-center gap-1 flex-wrap">
                          {proj.builders.map((b) => (
                            <span
                              key={b}
                              onClick={() => {
                                onClose();
                                onSelectPlayer?.(b);
                              }}
                              className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-emerald-500/20 text-[10px] text-neutral-300 hover:text-emerald-300 cursor-pointer transition-colors"
                            >
                              @{b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-500">
                        {distFromSpawn} бл. от спавна
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCoords(proj)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                        title="Скопировать координаты /tp"
                      >
                        <Copy className="w-3 h-3" />
                        <span>X: {proj.coordinates.x} | Z: {proj.coordinates.z}</span>
                      </button>

                      <a
                        href={`http://map.latzland.eu:29476/#${proj.coordinates.dimension === 'nether' ? 'world_nether' : 'world'}:${proj.coordinates.x}:${proj.coordinates.y || 70}:${proj.coordinates.z}:100:0:0:0:0:perspective`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 transition-colors"
                        title="Посмотреть на 3D карте BlueMap"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>

                      {proj.eventId && (
                        <button
                          onClick={() => {
                            onClose();
                            onSelectEvent?.(proj.eventId!);
                          }}
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors"
                          title="Показать событие в таймлайне"
                        >
                          Событие
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#0e0e0e] border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <span>Отображается проектов: <strong>{filteredProjects.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {projectToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#181818] border border-red-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Удалить постройку?</h3>
                  <p className="text-xs text-neutral-400">
                    Это действие навсегда удалит объект из каталога строек.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="font-bold text-white text-sm">{projectToDelete.title}</div>
                <div className="text-neutral-400">
                  Строители: {projectToDelete.builders?.join(', ') || 'Не указаны'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Да, удалить</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
