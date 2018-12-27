import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { DEFAULT_THEME } from '../constants'
import Bars from './bars'
import Labels from './labels'
import Scroller from './scroller'

const RootContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`

const BarsContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default class BarChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      oldOffset: 0,
      offset: 0,
      scrolling: false
    }
  }

  render() {
    const {
      theme,
      bars,
      barWidth,
      barSpace,
      onBarSelect,
      centerBarIndex,
      showScroll = true
    } = this.props
    const { width, height, offset, oldOffset, scrolling, totalWidth } = this.state
    const bar = barWidth + barSpace
    const getStartIndex = () => {
      const startIndex = Math.floor((totalWidth - width - oldOffset - (offset > oldOffset ? offset  - oldOffset : 0)) / bar)
      if (startIndex < 0) return 0
  
      return startIndex
    }
    const startIndex = getStartIndex()
    const lastIndex = Math.ceil((totalWidth - oldOffset + (offset < oldOffset ? oldOffset - offset : 0)) / bar)
    const slicedBars = bars.slice(startIndex, lastIndex)
    const commonProps = { totalWidth, width, offset, oldOffset }
    const highest = bars.map(b => b.items).reduce((acc, bar) => {
      const height = bar.reduce((acc, { value }) => acc + value, 0)
      return height > acc ? height : acc
    }, 0)
    const barsProps = {
      ...commonProps,
      highest,
      height,
      barWidth,
      barSpace,
      onBarSelect,
      centerBarIndex,
      startIndex,
      items: slicedBars.map(b => b.items),
    }
    const labels = slicedBars.map(b => b.label)
    const labelsProps = {
      ...commonProps,
      startIndex,
      barWidth,
      barSpace,
      centerBarIndex,
      labels
    }
    const scrollerProps = {
      ...commonProps,
      scrolling,
      onDragStart: () => this.setState({ scrolling: true, oldOffset: this.state.offset }),
      onDrag: this.onScroll,
      onDragEnd: () => this.setState({ scrolling: false })
    }
    const Content = () => (
      <React.Fragment>
        <BarsContainer ref={el => this.barsContainer = el}>
          {height && <Bars {...barsProps} />}
        </BarsContainer>
        {!labels.every(l => !l) && <Labels {...labelsProps}/>}
        {showScroll && <Scroller {...scrollerProps}/>}
      </React.Fragment>
    )

    return (
      <ThemeProvider theme={{ ...DEFAULT_THEME, ...theme}}>
        <RootContainer ref={el => this.RootContainer = el}>
          {width && <Content/>}
        </RootContainer>
      </ThemeProvider>
    )
  }

  componentDidUpdate() {
    const { height } = this.barsContainer.getBoundingClientRect()
    if (this.state.height !== height) {
      this.setState({ height })
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
    const { width } = this.RootContainer.getBoundingClientRect()
    this.setState({ width })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  onResize = () => {
    const { width, height } = this.barsContainer.getBoundingClientRect()
    this.setState({ width, height })
  }

  onScroll = (movementX) => {
    const { width, offset, totalWidth } = this.state
    const { barWidth, barSpace, bars, selectCenterBarOnScroll, centerBarIndex, onBarSelect } = this.props
    const additionalOffset = (totalWidth / width) * movementX
    const getOffset = () => {
      const newOffset = offset - additionalOffset
      if (newOffset < 0) return 0
      if (newOffset + width > totalWidth) return totalWidth - width
      return newOffset
    }
    const newOffset = getOffset()
    this.setState({ offset: newOffset, oldOffset: newOffset })
    if (selectCenterBarOnScroll) {
      const center = totalWidth - newOffset - width / 2
      const newCenterBarIndex = bars.findIndex((_, index) => ((index) * (barWidth + barSpace)) >= center) - 1
      if (centerBarIndex !== newCenterBarIndex) {
        onBarSelect(newCenterBarIndex)
      }
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { width, offset, scrolling } = prevState
    if (!width) return null

    const { centerBarIndex, barWidth, barSpace, bars } = nextProps

    const bar = barWidth + barSpace
    const totalWidth = bars.length * bar
    const getNewOffsets = () => {
      if (centerBarIndex !== undefined && !scrolling) {
        const offsetToCenter = totalWidth - bar * centerBarIndex - (width + bar) / 2
        const getOffset = () => {
          if (offsetToCenter < 0) return 0
          if (offsetToCenter + width > totalWidth) return totalWidth - width
          return offsetToCenter
        }
        return {
          ...prevState,
          offset: getOffset(),
          oldOffset: offset
        }
      }
    }

    return {
      ...prevState,
      ...getNewOffsets(),
      totalWidth
    }
  }
}
