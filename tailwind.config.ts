import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(to right, hsl(0 0% 20%), hsl(0 0% 10%))',
        'gradient-primary-hover': 'linear-gradient(to right, hsl(0 0% 25%), hsl(0 0% 15%))',
        'gradient-hero': 'linear-gradient(to bottom, hsl(0 0% 96%), hsl(0 0% 100%))',
        'gradient-cta': 'linear-gradient(to bottom right, hsl(0 0% 20%), hsl(0 0% 8%))',
        'gradient-accent': 'linear-gradient(to bottom right, hsl(0 0% 94%), hsl(0 0% 88%))',
        'gradient-card-primary': 'linear-gradient(to bottom right, hsl(0 0% 96%), hsl(0 0% 92%))',
        'gradient-card-secondary': 'linear-gradient(to bottom right, hsl(0 0% 98%), hsl(0 0% 94%))',
        'gradient-dark-section': 'linear-gradient(to bottom right, hsl(0 0% 18%), hsl(0 0% 10%))',
        'gradient-icon-primary': 'linear-gradient(to bottom right, hsl(0 0% 30%), hsl(0 0% 20%))',
        'gradient-icon-secondary': 'linear-gradient(to bottom right, hsl(0 0% 88%), hsl(0 0% 80%))',
        'gradient-icon-success': 'linear-gradient(to bottom right, hsl(142 71% 45% / 0.15), hsl(142 71% 45% / 0.25))',
        'gradient-brand': 'linear-gradient(to right, hsl(38 92% 50%), hsl(38 92% 42%))',
        'gradient-brand-hover': 'linear-gradient(to right, hsl(38 92% 55%), hsl(38 92% 47%))',
        'gradient-icon-brand': 'linear-gradient(to bottom right, hsl(38 92% 50% / 0.15), hsl(38 92% 50% / 0.25))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        highlight: {
          DEFAULT: 'hsl(var(--highlight))',
          foreground: 'hsl(var(--highlight-foreground))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          muted: 'hsl(var(--brand-muted))',
          'muted-foreground': 'hsl(var(--brand-muted-foreground))',
        },
        tan: 'hsl(var(--tan))',
        'light-brown': 'hsl(var(--light-brown))',
        'dark-brown': 'hsl(var(--dark-brown))',
        charcoal: 'hsl(var(--charcoal))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
