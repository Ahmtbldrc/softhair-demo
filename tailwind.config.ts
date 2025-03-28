import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
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
  				'6': 'hsl(var(--chart-6))',
  				'7': 'hsl(var(--chart-7))',
  				'8': 'hsl(var(--chart-8))',
  				'9': 'hsl(var(--chart-9))',
  				'10': 'hsl(var(--chart-10))',
  				'11': 'hsl(var(--chart-11))',
  				'12': 'hsl(var(--chart-12))',
  				'13': 'hsl(var(--chart-13))',
  				'14': 'hsl(var(--chart-14))',
  				'15': 'hsl(var(--chart-15))',
  				'16': 'hsl(var(--chart-16))',
  				'17': 'hsl(var(--chart-17))',
  				'18': 'hsl(var(--chart-18))',
  				'19': 'hsl(var(--chart-19))',
  				'20': 'hsl(var(--chart-20))',
  				'21': 'hsl(var(--chart-21))',
  				'22': 'hsl(var(--chart-22))',
  				'23': 'hsl(var(--chart-23))',
  				'24': 'hsl(var(--chart-24))',
  				'25': 'hsl(var(--chart-25))',
  				'26': 'hsl(var(--chart-26))',
  				'27': 'hsl(var(--chart-27))',
  				'28': 'hsl(var(--chart-28))',
  				'29': 'hsl(var(--chart-29))',
  				'30': 'hsl(var(--chart-30))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		animation: {
  			gradient: 'gradient 3s ease infinite',
  		},
  		keyframes: {
  			gradient: {
  				'0%, 100%': {
  					'background-position': '0% 50%',
  				},
  				'50%': {
  					'background-position': '100% 50%',
  				},
  			},
  		},
  	}
  },
  plugins: [animate],
};
export default config;
