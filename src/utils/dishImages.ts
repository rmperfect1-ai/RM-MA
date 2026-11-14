import { DISH_PHOTO_ASSETS } from '../assets/dishPhotos';
import { SAYQAL_ASSETS } from '../assets/heroAssets';

export function resolveDishImageUrl(dishId: string, customImageUrl?: string): string | undefined {
  if (customImageUrl && customImageUrl.trim()) {
    return customImageUrl.trim();
  }
  return DISH_PHOTO_ASSETS[dishId];
}

export function resolveGalleryAssetUrl(keyOrUrl: string): string {
  if (keyOrUrl === 'cardDishes') return SAYQAL_ASSETS.cardDishes;
  if (keyOrUrl === 'cardAmbiance') return SAYQAL_ASSETS.cardAmbiance;
  if (keyOrUrl === 'cardDesserts') return SAYQAL_ASSETS.cardDesserts;
  if (keyOrUrl === 'cardEvents') return SAYQAL_ASSETS.cardEvents;
  if (keyOrUrl === 'heroInterior') return SAYQAL_ASSETS.heroInterior;
  if (DISH_PHOTO_ASSETS[keyOrUrl]) return DISH_PHOTO_ASSETS[keyOrUrl];
  return keyOrUrl;
}
