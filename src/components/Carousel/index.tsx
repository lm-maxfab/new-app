import { Component, JSX, createRef, RefObject, VNode } from 'preact'

import Icon, { Icons } from '~/components/Icon'
import CarouselElement, { Media } from './components/CarouselElement'

import bem from '~/utils/bem'
import styles from './styles.module.scss'

interface State {
  index: number,
  visibleIndex?: number,
  arrowsPos?: number,
  componentWidth?: number,
  carouselWidth?: number,
  translateValue?: number,
  controlsReady?: boolean,
  fullscreen?: boolean
}

interface Props {
  customClass?: string
  leftArrow?: boolean
  rightArrow?: boolean
  arrowsPosition?: string
  dots?: boolean
  loop?: boolean
  duration?: number
  fullscreen?: boolean
  imageHeight?: number
  imageFit?: string
  gapValue?: number
  backgroundColor?: string
  imageBackgroundColor?: string
  titleColor?: string
  descriptionColor?: string
  creditsColor?: string
  dotColor?: string
  fullscreenButtonColor?: string
  arrowColor?: string
  arrowColorDisabled?: string
  arrowBackgroundColor?: string
  arrowBackgroundColorHover?: string
  title?: string|VNode
  credits?: string|VNode
  description?: string|VNode
  images?: Media[]
}

class Carousel extends Component<Props, State> {
  displayDots: boolean
  displayArrows: boolean
  displayControls: boolean

  loop: boolean
  defaultLoopDuration: number
  loopDuration: number

  scrollableRef: RefObject<HTMLDivElement>
  containerRef: RefObject<HTMLDivElement>
  imageWrapperRef: RefObject<HTMLDivElement>
  controlsRef: RefObject<HTMLDivElement>
  titleRef: RefObject<HTMLDivElement>

  targetIndex!: number | null
  scrollBreakpoints: number[]
  indexThreshold: number

  gapValue: number
  paddingValue: number

  loopTimer!: number
  loadingInterval!: number

  bemClss = bem('lm-carousel')

  state: State = {
    index: 0
  }

  /* * * * * * * * * * * * * * * * * * *
    * CONSTRUCTOR
    * * * * * * * * * * * * * * * * * * */
  constructor(props: Props) {
    super(props)

    this.displayDots = props.dots ?? false
    this.displayArrows = (props.leftArrow || props.rightArrow) ?? false
    this.displayControls = this.displayDots || this.displayArrows

    this.loop = props.loop ?? false
    if (!this.displayControls) { this.loop = true }

    this.defaultLoopDuration = 2000
    this.loopDuration = typeof props.duration === 'number'
      ? props.duration
      : this.defaultLoopDuration

    this.scrollableRef = createRef()
    this.containerRef = createRef()
    this.imageWrapperRef = createRef()
    this.controlsRef = createRef()
    this.titleRef = createRef()
    this.targetIndex = null

    this.scrollBreakpoints = []
    this.indexThreshold = 0

    this.gapValue = props.gapValue ?? 16
    this.paddingValue = this.gapValue * 2.5

    this.toggleFullscreen = this.toggleFullscreen.bind(this)

    this.handleImageLoaded = this.handleImageLoaded.bind(this)
    this.handleScroll = this.handleScroll.bind(this)
    this.calculateDimensions = this.calculateDimensions.bind(this)
    this.fixArrowsPosition = this.fixArrowsPosition.bind(this)
    this.positionArrows = this.positionArrows.bind(this)

    this.incrementIndex = this.incrementIndex.bind(this)
    this.decrementIndex = this.decrementIndex.bind(this)
  }

  /* * * * * * * * * * * * * * * * * * *
    * METHODS
    * * * * * * * * * * * * * * * * * * */
  componentDidMount() {
    if (this.loop === true) {
      this.setLoopTimer(this.loopDuration)
    }

    this.calculateDimensions()

    setTimeout(this.fixArrowsPosition, 200)
    setTimeout(this.fixArrowsPosition, 500)

    this.loadingInterval = window.setInterval(this.fixArrowsPosition, 1000)

    window.addEventListener('resize', this.calculateDimensions)
  }

  componentWillUnmount() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer)
    }
  }

  handleScroll() {
    // si on s'arrête sur un breakpoint au scroll, on re-update l'index au cas où
    const scrollValue = this.scrollableRef.current?.scrollLeft ?? 0

    let newVisibleIndex = [...this.scrollBreakpoints].filter(breakpoint => breakpoint < (scrollValue - this.indexThreshold)).length

    if (newVisibleIndex != this.state.visibleIndex) {
      this.setState(curr => ({
        ...curr,
        visibleIndex: newVisibleIndex
      }))
    }

    let snappedIndex = this.scrollBreakpoints.findIndex((breakpoint: number) => breakpoint === scrollValue)

    if (snappedIndex != -1) {
      // si on est juste en scroll auto à partir d'un clic sur un point, on s'arrête
      if (this.targetIndex != null && snappedIndex != this.targetIndex) {
        return
      }

      // si on est arrivé sur le bon index, on peut clean targetIndex
      this.targetIndex = null

      this.setState(curr => ({
        ...curr,
        index: snappedIndex,
        translateValue: scrollValue,
      }))
    }
  }

  fixArrowsPosition() {
    if (this.titleRef.current === null) return

    const titleDimensions = this.titleRef.current?.getBoundingClientRect()
    const imageDimensions = this.imageWrapperRef.current?.getBoundingClientRect()

    const titleHeight = titleDimensions ? titleDimensions.height : 0
    const imageHeight = imageDimensions ? imageDimensions.height : 0

    let fixed = this.state.arrowsPos === (titleHeight + imageHeight / 2)
    if (imageHeight === 0) fixed = true

    if (!fixed) {
      this.positionArrows()
    } else {
      this.setState(curr => ({
        ...curr,
        controlsReady: true
      }))

      clearInterval(this.loadingInterval)
    }
  }

  setLoopTimer(duration: number) {
    this.loopTimer = window.setInterval(() => {
      this.incrementIndex()
    }, duration)
  }

  // [WIP][ELSA] je pense que setIndex, increment et decrement pourraient
  // tenir en une seule fonction, à la limite increment et decrement pourraient
  // être des racourcis si vraiment y'en a besoin genre :
  // incrementIndex () { this.setIndex(this.state.index + 1) }
  // decrementIndex () { this.setIndex(this.state.index - 1) }

  // [WIP][ELSA] C'est setIndex qui doit s'assurer que l'index
  // sur lequel on atterrit est bien compris entre 0 et props.images.length
  // et pour ce faire, tu peux utiliser ~/utils/absolute-modulo, genre
  // const newIndex = absoluteModulo(number, props.images.length)
  // ça pourrait marcher avec un opérateur modulo simple genre :
  // const newIndex = number % props.images.length
  // Pour info sur l'opérateur modulo :
  // 0 % 2 === 0, 1 % 2 === 1, 2 % 2 === 0, etc...
  // MAIS : -1 % 2 === -1, alors que absoluteModulo(-1, 2) === 1
  setIndex(number: number) {
    // [WIP][ELSA] toujours if (boolean) pour plus de clarté
    if (this.loopTimer) {
      clearInterval(this.loopTimer)
      this.setLoopTimer(this.loopDuration)
    }

    this.targetIndex = number

    const translateValue = number === 0
      ? 0
      : number * ((this.state.componentWidth ?? 0) - this.gapValue * 4) - this.gapValue * 1.5

    if (this.scrollableRef.current) this.scrollableRef.current.scrollLeft = translateValue

    this.setState(curr => ({
      ...curr,
      index: number,
      translateValue,
    }))
  }

  incrementIndex() {
    if (this.props.images === undefined) return

    const nextIndex = this.state.index === this.props.images.length - 1 ? 0 : this.state.index + 1
    this.setIndex(nextIndex)
  }

  decrementIndex() {
    if (this.props.images === undefined) return

    const prevIndex = this.state.index === 0 ? this.props.images?.length - 1 : this.state.index - 1
    this.setIndex(prevIndex)
  }

  positionArrows() {
    if (this.titleRef.current === null) return
    if (this.imageWrapperRef.current === null) return

    const titleDimensions = this.titleRef.current?.getBoundingClientRect()
    const imageDimensions = this.imageWrapperRef.current?.getBoundingClientRect()

    const titleHeight = titleDimensions ? titleDimensions.height : 0
    const imageHeight = imageDimensions ? imageDimensions.height : 0
    const imageY = imageDimensions ? imageDimensions.y : 0

    let arrowsPos = 0

    if (imageHeight > 0) {
      arrowsPos = this.state.fullscreen
        ? imageY + imageHeight / 2
        : titleHeight + imageHeight / 2
    }

    this.setState(curr => ({
      ...curr,
      arrowsPos
    }))
  }

  calculateDimensions() {
    const imagesNumber = this.props.images?.length ?? 0

    const componentWidth = this.containerRef.current?.getBoundingClientRect().width ?? 0
    const elementWidth = componentWidth - this.gapValue * 4
    const carouselWidth = imagesNumber * elementWidth - this.gapValue + this.paddingValue * 2

    // on calcule les breakpoints du scroll snap
    if (componentWidth > 0) {
      this.scrollBreakpoints = []
      for (let i = 0; i < imagesNumber; i++) {
        let value = this.paddingValue + i * elementWidth - this.gapValue * 2.5
        if (i === 0) value = 0
        this.scrollBreakpoints.push(value)
      }
    }

    this.indexThreshold = this.scrollBreakpoints[1] / 2

    // [WIP][ELSA] Attention, tu as un setState qui après avoir
    // changé le state appelle une fonction qui... setState aussi !
    // Ça c'est une situation qui te dit à 100% qu'il faut trouver un autre moyen
    this.setState(curr => ({
      ...curr,
      componentWidth,
      carouselWidth
    }),
      this.positionArrows
    )
  }

  handleImageLoaded() {
    if (this.scrollableRef.current) this.scrollableRef.current.scrollLeft = 0
  }

  // [WIP][ELSA] !! 3 setState consécutifs !
  toggleFullscreen() {
    this.setState(
      curr => ({
        ...curr,
        fullscreen: !curr.fullscreen
      }),
      this.calculateDimensions
    )
  }

  /* * * * * * * * * * * * * * *
    * RENDER
    * * * * * * * * * * * * * * */
  render(): JSX.Element {
    const { props, state, bemClss } = this
    // [WIP][ELSA] Normalement il doit y avoir un moyen de faire sans ça
    // qui est probablement un peu buggy : si le contenu du titre doit 
    // changer sur ce rendu, les dimensions de titleRef elles seront
    // celles de l'ancien titre et donc seront incorrectes
    const titleDimensions = this.titleRef?.current?.getBoundingClientRect()
    const controlsDimensions = this.controlsRef?.current?.getBoundingClientRect()
    const titleHeight = titleDimensions !== undefined ? titleDimensions.height : 0
    const controlsHeight = controlsDimensions ? controlsDimensions.height : 0
    const imagesMaxHeight = this.state.fullscreen
      ? window.innerHeight - titleHeight - controlsHeight + 'px'
      : 'unset'

    const containerClasses = [bemClss.value, styles['container']]
    if (props.customClass !== undefined) containerClasses.push(props.customClass)
    if (props.imageFit === 'cover') containerClasses.push(styles['container--cover'])
    else containerClasses.push(styles['container--contain'])
    if (props.arrowsPosition === 'bottom') containerClasses.push(styles['container--arrows-bottom'])
    else containerClasses.push(styles['container--arrows-center'])
    if (this.state.fullscreen) containerClasses.push(styles['container--fullscreen'])
    const titleClasses = [bemClss.elt('title').value, styles['title']]
    const fullscreenBtnClasses = [bemClss.elt('fullscreen-btn').value, styles['fullscreen-btn']]
    const scrollableClasses = [bemClss.elt('scrollable').value, styles['scrollable']]
    const imagesClasses = [bemClss.elt('images').value, styles['images']]
    const controlsClasses = [bemClss.elt('controls').value, styles['controls']]
    if (this.state.controlsReady) controlsClasses.push(styles['controls--visible'])
    const dotsClasses = [bemClss.elt('dots').value, styles['dots']]
    const leftArrowClasses = [bemClss.elt('arrow').value, styles['arrow']]
    const rightArrowClasses = [bemClss.elt('arrow').value, styles['arrow']]
    if (state.index === 0) leftArrowClasses.push(styles['arrow--disabled'])
    if (state.index === (props.images?.length ?? 0) - 1) rightArrowClasses.push(styles['arrow--disabled'])
    const arrowsClasses = [bemClss.elt('arrows').value, styles['arrows']]
    const arrowsStyle = top ? `top: ${top}px` : ''

    // [WIP][ELSA] il vaudrait mieux que les variables ne soient pas définies si la prop est undefined
    // genre if (this.settings.backgroundColor !== undefined) { containerStyle['--carousel-bg-color'] = this.settings.backgroundColor }
    // par ailleurs, est-ce que tous ces settings sont assignables via un css externe ? Si oui, on va quand
    // même garder cette logique de style via props pour l'instant mais à l'avenir je pense qu'il vaudra mieux ne 
    // pas passer par les props pour styliser nos composants
    // (avant d'avoir une vraie logique globale pour assigner des thèmes globaux à chacun des composants)
    const containerStyle = `
      --carousel-gap-value: ${this.gapValue}px;
      --carousel-padding-value: ${this.paddingValue}px;
      ${props.backgroundColor ? `--carousel-bg-color: ${props.backgroundColor}` : ''};
      ${props.imageBackgroundColor ? `--carousel-image-bg: ${props.imageBackgroundColor}` : ''};
      ${props.titleColor ? `--carousel-title-color: ${props.titleColor}` : ''};
      ${props.descriptionColor ? `--carousel-description-color: ${props.descriptionColor}` : ''};
      ${props.creditsColor ? `--carousel-credits-color: ${props.creditsColor}` : ''};
      ${props.dotColor ? `--carousel-dot-color: ${props.dotColor}` : ''};
      ${props.fullscreenButtonColor ? `--carousel-fullscreen-btn-color: ${props.fullscreenButtonColor}` : ''};
      ${props.arrowColor ? `--carousel-arrow-color: ${props.arrowColor}` : ''};
      ${props.arrowColorDisabled ? `--carousel-arrow-color-disabled: ${props.arrowColorDisabled}` : ''};
      ${props.arrowBackgroundColor ? `--carousel-arrow-bg: ${props.arrowBackgroundColor}` : ''};
      ${props.arrowBackgroundColorHover ? `--carousel-arrow-bg-hover: ${props.arrowBackgroundColorHover}` : ''};
      ${props.imageHeight && !this.state.fullscreen ? `--carousel-image-height: ${props.imageHeight}px` : ''};
    `
    // [WIP][ELSA] il vaut mieux passer des variables dans le style inline et appliquer le vrai style
    // depuis styles.module.scss genre 
    // const imagesContainerStyle = `--width: ${this.state.carouselWidth}px;`
    // .imagesContainer { width: --width; }
    const imagesContainerStyle = `
      width: ${this.state.carouselWidth}px;
      height: ${imagesMaxHeight};
      grid-template-columns: repeat(${props.images?.length ?? 0}, 1fr);`

    return (
      <div ref={this.containerRef} className={containerClasses.join(' ')} style={containerStyle}>

        <div ref={this.titleRef} className={titleClasses.join(' ')}>
          {props.title !== undefined && props.title}
        </div>

        {/* [WIP][ELSA] plutôt que de faire un check sur settings.fullscreen et state.fullscreen ici
          * il vaudrait mieux s'assurer dans toggleFullscreen qu'on ne peut pas passer state.fullscreen
          * si settings.fullscreen !== true
         */}
        {props.fullscreen
          && <div onClick={this.toggleFullscreen} className={fullscreenBtnClasses.join(' ')}>
            {this.state.fullscreen
              ? <Icon file={Icons.FULLSCREEN_CLOSE} />
              : <Icon file={Icons.FULLSCREEN_OPEN} />}
          </div>}

        <div ref={this.scrollableRef} onScroll={this.handleScroll} className={scrollableClasses.join(' ')}>

          <div className={imagesClasses.join(' ')} style={imagesContainerStyle}>
            {/* [WIP][ELSA] tu as pas mal de props qui pourraient être un tout petit peu plus
            explicites dans leur nom, genre visible => isVisible, selected => isSelected
            fullscreen => isFullscreen, etc... */}
            {/* [WIP][ELSA] il vaudrait mieux que la ref que tu veux mettre soit assignée dans ce fichier
            (via une div que tu mettrais autour par ex), et que CarouselElement n'ait
            rien à voir avec ça, mais surtout... tu passes la même ref à chaque objet CarouselElement là non ? */}
            {props.images?.map((media, i) => {
              return <CarouselElement
                media={media}
                visible={this.state.visibleIndex === i}
                selected={this.state.index === i}
                carouselDescription={props.description}
                carouselCredits={props.credits}
                onImageLoad={this.handleImageLoaded}
                imageWrapperRef={this.imageWrapperRef}
              />
            })}

          </div>

        </div>

        {this.displayControls
          && <div ref={this.controlsRef} className={controlsClasses.join(' ')}>

            {this.displayDots
              && <div className={dotsClasses.join(' ')}>
                {[...Array(props.images?.length)].map((_el, i) => {
                  const dotClasses = [bemClss.elt('dot').value, styles['dot']]
                  if (this.state.index === i) dotClasses.push(styles['dot--selected'])

                  return (
                    <span
                      onClick={() => this.setIndex(i)}
                      className={dotClasses.join(' ')}>
                    </span>
                  )
                })}
              </div>}

            {/* [WIP][ELSA] ah, donc plutôt : {displayDots && <>
              {this.renderProgressDots(props.images?.length ?? 0)}
              {this.renderArrows({
                leftArrow: this.settings.leftArrow ?? false,
                rightArrow: this.settings.rightArrow ?? false,
                index: this.state.index,
                limit: (props.images?.length ?? 0) - 1,
                top: this.state.arrowsPos
              })}
            </>} */}

            {this.displayArrows && <div
              className={arrowsClasses.join(' ')}
              style={arrowsStyle}>
              {props.leftArrow && <div
                className={leftArrowClasses.join(' ')}
                onClick={this.decrementIndex}>
                <Icon file={Icons.ARROW_LEFT} />
              </div>}
              {props.rightArrow && <div
                className={rightArrowClasses.join(' ')}
                onClick={this.incrementIndex}>
                <Icon file={Icons.ARROW_RIGHT} />
              </div>}
            </div>}

          </div>}

      </div>
    )
  }

}

export type { Props, State, Media }
export default Carousel