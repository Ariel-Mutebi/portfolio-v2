<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import { SplitText } from 'gsap/SplitText';

  let card: HTMLElement;

  onMount(() => {
    const ctx = gsap.context(() => {
      // Initial text reveal
      const tl = gsap.timeline({
        defaults: {
          duration: 1.2,
          ease: 'power4.out'
        }
      });

      tl.fromTo(
        '.reveal-text',
        {
          yPercent: 110
        },
        {
          yPercent: 0,
          stagger: 0.15
        }
      );

      // 2. Breathing animation
      gsap.to('.reveal-text', {
        opacity: 0.85,
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.3,
          from: 'start'
        }
      });

      // 3. Proximity magnetic interaction

      const radius = 100;
      const strength = 0.35;
      const maxDisplacement = 12;

      // Split text into characters
      const splitInstances = gsap.utils
        .toArray<HTMLElement>('.magnetic-text')
        .map((element) =>
          SplitText.create(element, {
            type: 'chars',
            charsClass: 'magnetic-char'
          })
        );

      const characters = splitInstances.flatMap((instance) => instance.chars) as HTMLElement[];

      // Cache character animation functions
      const magneticChars = characters.map((char) => ({
        element: char,

        x: gsap.quickTo(char, 'x', {
          duration: 0.45,
          ease: 'power3.out'
        }),

        y: gsap.quickTo(char, 'y', {
          duration: 0.45,
          ease: 'power3.out'
        })
      }));

      const handlePointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return;

        magneticChars.forEach(({ element, x, y }) => {
          const rect = element.getBoundingClientRect();

          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Distance between cursor and character
          const dx = event.clientX - centerX;
          const dy = event.clientY - centerY;

          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < radius) {
            // Calculate proximity strength (1 = closest, 0 = outside radius)
            const proximity = 1 - distance / radius;

            // Ease the magnetic attraction
            const force = Math.pow(proximity, 2);

            // Move character towards cursor
            const offsetX = dx * strength * force;
            const offsetY = dy * strength * force;

            x(gsap.utils.clamp(-maxDisplacement, maxDisplacement, offsetX));
            y(gsap.utils.clamp(-maxDisplacement, maxDisplacement, offsetY));
          } else {
            // Return characters outside the magnetic radius
            x(0);
            y(0);
          }
        });
      };

      const handlePointerLeave = () => {
        magneticChars.forEach(({ x, y }) => {
          x(0);
          y(0);
        });
      };

      card.addEventListener('pointermove', handlePointerMove);
      card.addEventListener('pointerleave', handlePointerLeave);

    }, card);

    return () => ctx.revert();
  });
</script>

<hgroup
  bind:this={card}
  class="relative z-10 row-start-2 grid p-5 gap-5 pb-8 max-w-2xl border border-ebony-400 rounded-xl
    bg-linear-to-br from-ebony-50 via-ebony-100 to-ebony-200 bg-size-[200%_200%] animate-ambient"
>
  <h1 class="text-8xl text-ebony-950 font-extrabold reveal-mask">
    <span class="reveal-text magnetic-text">
      Ariel Robert Mutebi
    </span>
  </h1>

  <h3 class="text-2xl text-ebony-900 reveal-mask">
    <span class="reveal-text magnetic-text">
      Full-stack web developer | TKS Innovator | Ex-Mapka
    </span>
  </h3>
</hgroup>
