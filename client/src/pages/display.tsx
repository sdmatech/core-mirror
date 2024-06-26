import React, { useEffect } from 'react'

import { trpc } from '../App'
import { DisplayCompetitorList, OnTrack } from 'ui-shared'

import { requestWrapper } from '../components/requestWrapper'
import { getDisplayNumber } from 'ui-shared/src/logic/displays'
import { Container } from '@mui/material'

export const DisplayPage = () => {
  const currentCompetitor = trpc.useQuery(['currentcompetitor.number'])
  const competitors = trpc.useQuery(['competitors.list'])
  const runCount = trpc.useQuery(['runs.count'])

  let displayRefresh = 15

  if (window.location.pathname === '/display/4') {
    displayRefresh = 5
  }

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await Promise.all([
        currentCompetitor.refetch(),
        competitors.refetch(),
        runCount.refetch(),
      ])
    }, 1000 * displayRefresh)
    return () => clearTimeout(timeout)
  }, [currentCompetitor, competitors, runCount])

  const requestErrors = requestWrapper(
    { currentCompetitor, allRuns: competitors, runCount },
    ['currentCompetitor']
  )
  if (requestErrors) return requestErrors

  if (!competitors.data) {
    console.warn('Missing allRuns data')
    return null
  } // This will never be called, but it is needed to make typescript happy

  const currentDisplayNumber = getDisplayNumber()
  const shouldDisplayCompetitorList =
    currentDisplayNumber === 0 || currentDisplayNumber === 4

  return (
    <Container>
      <DisplayCompetitorList
        competitors={competitors.data}
        runCount={runCount.data || 1}
      />

      {shouldDisplayCompetitorList && currentCompetitor.data && (
        <OnTrack
          currentCompetitorId={currentCompetitor.data}
          competitors={competitors.data}
        />
      )}
    </Container>
  )
}
