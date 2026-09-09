async function startMocks(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  if (import.meta.env.MODE === 'test') return

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    findWorker: (scriptUrl) => scriptUrl.includes('mockServiceWorker'),
  })
}

export const mocksReady = startMocks().catch((error: unknown) => {
  console.error('MSW failed to start', error)
})
