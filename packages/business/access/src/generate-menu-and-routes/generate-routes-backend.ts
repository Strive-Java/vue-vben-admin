import type {
  ComponentRecordType,
  RouteRecordStringComponent,
} from '@vben/types';
import type { RouteRecordRaw } from 'vue-router';

import type { GeneratorMenuAndRoutesOptions } from '../types';

import { $t } from '@vben-core/locales';
import { mapTree } from '@vben-core/toolkit';

/**
 * 动态生成路由 - 后端方式
 */
async function generateRoutesByBackend(
  options: GeneratorMenuAndRoutesOptions,
): Promise<RouteRecordRaw[]> {
  const { fetchMenuListAsync, layoutMap = {}, pageMap = {} } = options;

  try {
    const menuRoutes = await fetchMenuListAsync?.();
    if (!menuRoutes) {
      return [];
    }

    const normalizePageMap: ComponentRecordType = {};

    for (const [key, value] of Object.entries(pageMap)) {
      normalizePageMap[normalizeViewPath(key)] = value;
    }

    const routes = convertRoutes(menuRoutes, layoutMap, normalizePageMap);

    return routes;
  } catch (error) {
    console.error(error);
    return [];
  }
}

function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component, name } = node;

    if (!name) {
      console.error('route name is required', route);
    }

    // layout转换
    if (component && layoutMap[component]) {
      route.component = layoutMap[component];
      // 页面组件转换
    } else if (component) {
      const normalizePath = normalizeViewPath(component);
      route.component =
        pageMap[
          normalizePath.endsWith('.vue')
            ? normalizePath
            : `${normalizePath}.vue`
        ];
    }

    // 国际化转化
    if (route.meta?.title) {
      route.meta.title = $t(route.meta.title);
    }

    return route;
  });
}

function normalizeViewPath(path: string): string {
  // 去除相对路径前缀
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  return viewPath.replace(/^\/views/, '');
}
export { generateRoutesByBackend };
