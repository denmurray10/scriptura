import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        'book': '1px 1px 3px 0px rgba(0,0,0,0.1), 5px 5px 15px 0px rgba(0,0,0,0.2)',
        'shelf-bottom': 'inset 0 -8px 8px -8px rgba(0,0,0,0.7), inset 0 8px 8px -8px rgba(0,0,0,0.7)',
      },
      dropShadow: {
        'xl': [
            '0 20px 13px rgba(0, 0, 0, 0.03137)',
            '0 8px 5px rgba(0, 0, 0, 0.08)',
            '0 18px 15px rgba(0, 0, 0, 0.3294)'
        ],
      },
      fontFamily: {
        sans: ['var(--font-open-sans)', 'sans-serif'],
        headline: ['var(--font-playfair)', 'serif'],
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
        'gradient-start': 'hsl(var(--gradient-start))',
        'gradient-end': 'hsl(var(--gradient-end))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'mobile-header-gradient': 'radial-gradient(ellipse 30rem 10rem at 50% -10rem, hsl(var(--mobile-header-start)/0.3), transparent 80%)',
        'border-gradient': 'conic-gradient(from 180deg at 50% 50%, hsl(var(--gradient-end)) 0%, hsl(var(--gradient-end)/0.5) 20%, hsl(var(--gradient-start)/0.5) 30%, hsl(var(--gradient-start)) 50%, hsl(var(--gradient-start)/0.5) 70%, hsl(var(--gradient-end)/0.5) 80%, hsl(var(--gradient-end)) 100%)',
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
        'marquee-up': {
          'from': { transform: 'translateY(0)' },
          'to': { transform: 'translateY(-50%)' },
        },
        'marquee-down': {
          'from': { transform: 'translateY(-50%)' },
          'to': { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'border-spin': {
            '100%': { transform: 'rotate(360deg)' },
        },
        'marquee-x': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'marquee-up-slow': 'marquee-up 60s linear infinite',
        'marquee-down-slow': 'marquee-down 60s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-spin': 'border-spin 8s linear infinite',
        'marquee-x': 'marquee-x 80s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
