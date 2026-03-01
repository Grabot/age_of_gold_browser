declare module 'svelte-video';

declare module 'svelte-video' {
  import { SvelteComponent } from 'svelte';
  
  interface VideoProps {
    src: string;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    poster?: string;
    width?: string | number;
    height?: string | number;
    class?: string;
    style?: string;
  }
  
  export default class Video extends SvelteComponent<VideoProps> {}
}