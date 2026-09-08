import type { ProposalItem } from '../types';

export const INITIAL_LATZLAND_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop-1',
    type: 'event',
    status: 'pending',
    submittedAt: '2026-08-14 18:30',
    submittedBy: 'Alex_Miner',
    userComment: 'Мы провели турнир на новой арене, добавьте в хронологию пожалуйста!',
    eventData: {
      id: 'ev-prop-1',
      date: '2026-08-14',
      title: 'Большой гладиаторский турнир 1x1 в Колизее',
      description: 'Турнир между 12 игроками на звание сильнейшего дуэлянта Сезона 1. Победителем стал Alex_Miner, выиграв комплект незеритовой брони.',
      type: 'event',
      important: false,
      season: 1,
      players: ['Alex_Miner', 'Fr0gus', 'Vanechka', 'ShadowDigger'],
      coordinates: { x: 380, y: 72, z: -190, dimension: 'overworld' },
    },
  },
  {
    id: 'prop-2',
    type: 'project',
    status: 'pending',
    submittedAt: '2026-08-20 14:15',
    submittedBy: 'Vanechka',
    userComment: 'Строим скоростную железную дорогу между южными поселениями.',
    projectData: {
      id: 'proj-prop-2',
      title: 'Южная трансконтинентальная железная дорога',
      description: 'Магистраль из энергорельсов протяженностью 2500 блоков, связывающая фермерские угодья с рыночной площадью.',
      category: 'infrastructure',
      status: 'in_progress',
      progressPercent: 45,
      builders: ['Vanechka', 'CreeperLover'],
      coordinates: { x: -450, y: 68, z: 800, dimension: 'overworld' },
      season: 1,
      materials: ['Энергорельсы', 'Красный камень', 'Полированный андезит'],
    },
  },
];

export const INITIAL_PROPOSALS = INITIAL_LATZLAND_PROPOSALS;
