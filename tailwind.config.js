/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	daisyui: {
		themes: [
			{
				light: {
					primary: '#f000b8',
					secondary: '#570df8',
					accent: '#1dcdbc',
					neutral: '#2b3440',
					'base-100': '#ffffff',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				}
			},
			{
				dark: {
					primary: '#d926a9',
					secondary: '#641ae6',
					accent: '#1fb2a6',
					neutral: '#2a323c',
					'base-100': '#1d232a',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				}
			}
		],
		logs: false
	},
	plugins: [require("@tailwindcss/typography"), require('daisyui')]
};
