import path from 'path';

export const PROJECT_ROOT = process.cwd();
export const DASHBOARD_ROOT = path.resolve(PROJECT_ROOT, 'dashboard');
export const CLIENT_DIST_PATH = path.resolve(DASHBOARD_ROOT, 'client', 'dist');
export const EDITOR_ROOT_PATH = path.resolve(PROJECT_ROOT, 'src', 'commands');
export const ROOT_CHANGELOG_PATH = path.resolve(PROJECT_ROOT, 'CHANGELOG.md');
