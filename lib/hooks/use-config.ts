import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SiteConfigs {
  carousel_products: string[];
  carousel_max_slides: number;
  new_products_limit: number;
  homepage_story_title: string;
  homepage_story_description: string;
  
  about_hero_title: string;
  about_hero_description: string;
  about_heritage_title: string;
  about_heritage_desc1: string;
  about_heritage_desc2: string;

  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_hours: string;

  contact_social_instagram: string;
  contact_social_instagram_user: string;
  contact_social_tiktok: string;
  contact_social_tiktok_user: string;
  store_enabled: boolean;
  store_message: string;
}

export function useConfig() {
  return useQuery<SiteConfigs>({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await fetch('/api/config');
      if (!res.ok) {
        throw new Error('Failed to load website configurations');
      }
      return res.json();
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SiteConfigs>) => {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update configurations');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });
}
