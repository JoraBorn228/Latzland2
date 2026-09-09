import type { PlayerProfile } from '../types';

export const INITIAL_PLAYERS: PlayerProfile[] = [
  {
    id: 'weistel',
    username: 'Weistel',
    role: 'Основатель сервера',
    description: 'Основал и запустил первый сезон LatzLand. Построил первые структуры на спавне.',
    color: '#ffd700',
    registeredAt: '2023-09-01',
    discord: 'weistel#0001',
    telegram: '@weistel',
    homeCoordinates: 'X: 0, Y: 72, Z: 0',
  },
  {
    id: 'fr0gus',
    username: 'Fr0gus',
    role: 'Первопроходец',
    description: 'Один из первых исследователей неизведанных биомов спавна и строитель первого общего дома.',
    color: '#64b5f6',
    registeredAt: '2023-09-05',
    discord: 'fr0gus#1337',
    homeCoordinates: 'X: 350, Y: 68, Z: -210',
  },
  {
    id: 'kregor',
    username: 'Kregor',
    role: 'Главный архитектор',
    description: 'Победитель строительных конкурсов и мастер возведения масштабных баз.',
    color: '#66bb6a',
    registeredAt: '2023-09-12',
    discord: 'kregor_builds',
    telegram: '@kregor_craft',
    homeCoordinates: 'X: -1200, Y: 85, Z: 840',
  },
  {
    id: 'alex_miner',
    username: 'Alex_Miner',
    role: 'Горняк / Инженер',
    description: 'Первооткрыватель центральной алмазной жилы и участник первой войны.',
    color: '#ab47bc',
    registeredAt: '2023-09-20',
    discord: 'alex_miner_99',
    homeCoordinates: 'X: 520, Y: 42, Z: 110',
  },
  {
    id: 'nordicking',
    username: 'NordicKing',
    role: 'Лидер «Северных»',
    description: 'Командир клана Северных в конфликте за Алмазную шахту.',
    color: '#ef5350',
    registeredAt: '2023-10-01',
    discord: 'nordic_king_clan',
    homeCoordinates: 'X: -2400, Y: 110, Z: -1800',
  },
];

export const INITIAL_LATZLAND_PLAYERS = INITIAL_PLAYERS;
