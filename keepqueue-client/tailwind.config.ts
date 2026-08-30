import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "star-movement-bottom": {
                    "0%": { transform: "translate(0%, 0%)", opacity: "1" },
                    "100%": { transform: "translate(-100%, 0%)", opacity: "0" },
                },
                "star-movement-top": {
                    "0%": { transform: "translate(0%, 0%)", opacity: "1" },
                    "100%": { transform: "translate(100%, 0%)", opacity: "0" },
                },
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                heartbeat: {
                    "0%": { transform: "scale(1)" },
                    "14%": { transform: "scale(1.12)" },
                    "28%": { transform: "scale(1)" },
                    "42%": { transform: "scale(1.12)" },
                    "70%": { transform: "scale(1)" },
                    "100%": { transform: "scale(1)" },
                },
                "fade-in": {
                    from: { opacity: "0" },
                    to: { opacity: "1" },
                },
                "fade-out": {
                    from: { opacity: "1" },
                    to: { opacity: "0" },
                },
                "slide-in-from-top": {
                    from: { transform: "translateY(-100%)" },
                    to: { transform: "translateY(0)" },
                },
                "slide-in-from-bottom": {
                    from: { transform: "translateY(100%)" },
                    to: { transform: "translateY(0)" },
                },
                "slide-in-from-left": {
                    from: { transform: "translateX(-100%)" },
                    to: { transform: "translateX(0)" },
                },
                "slide-in-from-right": {
                    from: { transform: "translateX(100%)" },
                    to: { transform: "translateX(0)" },
                },
                "slide-out-to-top": {
                    from: { transform: "translateY(0)" },
                    to: { transform: "translateY(-100%)" },
                },
                "slide-out-to-bottom": {
                    from: { transform: "translateY(0)" },
                    to: { transform: "translateY(100%)" },
                },
                "slide-out-to-left": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-100%)" },
                },
                "slide-out-to-right": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(100%)" },
                },
                "zoom-in": {
                    from: { transform: "scale(0)" },
                    to: { transform: "scale(1)" },
                },
                "zoom-out": {
                    from: { transform: "scale(1)" },
                    to: { transform: "scale(0)" },
                },
                "zoom-in-sm": {
                    from: { transform: "scale(0.95)", opacity: "0" },
                    to: { transform: "scale(1)", opacity: "1" },
                },
                "zoom-out-sm": {
                    from: { transform: "scale(1)", opacity: "1" },
                    to: { transform: "scale(0.95)", opacity: "0" },
                },
                bounce: {
                    "0%, 100%": { transform: "translateY(-25%)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
                    "50%": { transform: "translateY(0)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
                },
                "bounce-in": {
                    "0%": { transform: "scale(0.3)", opacity: "0" },
                    "50%": { transform: "scale(1.05)" },
                    "70%": { transform: "scale(0.9)" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
                "bounce-out": {
                    "0%": { transform: "scale(1)", opacity: "1" },
                    "30%": { transform: "scale(1.1)" },
                    "100%": { transform: "scale(0.3)", opacity: "0" },
                },
                shake: {
                    "0%, 100%": { transform: "translateX(0)" },
                    "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-10px)" },
                    "20%, 40%, 60%, 80%": { transform: "translateX(10px)" },
                },
                pulse: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },
                spin: {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
                "spin-reverse": {
                    from: { transform: "rotate(360deg)" },
                    to: { transform: "rotate(0deg)" },
                },
                ping: {
                    "75%, 100%": { transform: "scale(2)", opacity: "0" },
                },
                wiggle: {
                    "0%, 100%": { transform: "rotate(-3deg)" },
                    "50%": { transform: "rotate(3deg)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                glow: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.5" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                heartbeat: "heartbeat 3s ease-in-out infinite both",
                "fade-in": "fade-in 0.3s ease-in",
                "fade-out": "fade-out 0.3s ease-out",
                "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
                "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
                "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
                "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
                "slide-out-to-top": "slide-out-to-top 0.3s ease-in",
                "slide-out-to-bottom": "slide-out-to-bottom 0.3s ease-in",
                "slide-out-to-left": "slide-out-to-left 0.3s ease-in",
                "slide-out-to-right": "slide-out-to-right 0.3s ease-in",
                "zoom-in": "zoom-in 0.2s ease-out",
                "zoom-out": "zoom-out 0.2s ease-in",
                "zoom-in-sm": "zoom-in-sm 0.2s ease-out",
                "zoom-out-sm": "zoom-out-sm 0.2s ease-in",
                bounce: "bounce 1s infinite",
                "bounce-in": "bounce-in 0.6s ease-out",
                "bounce-out": "bounce-out 0.6s ease-in",
                shake: "shake 0.5s ease-in-out",
                pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                spin: "spin 1s linear infinite",
                "spin-reverse": "spin-reverse 1s linear infinite",
                ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
                wiggle: "wiggle 1s ease-in-out infinite",
                float: "float 3s ease-in-out infinite",
                glow: "glow 2s ease-in-out infinite",
                "star-movement-bottom": "star-movement-bottom linear infinite alternate",
                "star-movement-top": "star-movement-top linear infinite alternate",
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        plugin(function ({ addUtilities }) {
            addUtilities({
                ".center": {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                },
                ".col": {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignSelf: "center",
                    textAlign: "center",
                },
                ".full": {
                    width: "100%",
                    height: "100%",
                },
                ".ellipsis": {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                },
            });
        }),
    ],
} satisfies Config;

export default config;
