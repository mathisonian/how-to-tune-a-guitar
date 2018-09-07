const React = require('react');
import SVG from 'react-inlinesvg';
import * as d3 from 'd3';
import { Portal } from 'react-portal';

const { getAbsoluteSVG, isMobile } = require('./utils');

const freqSpread = 0.25;

const FREQUENCIES = {
  E2: 82.41,
  'F#2': 92.50,
  G2: 98.00,
  A2: 110.00,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  'F#3': 185.00,
  G3: 196.00,
  A3: 220.00,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  'F#4': 369.99,
  G4: 392.00
};
const BASE_FREQUENCIES = {
  E2: 'E2',
  'F#2': 'E2',
  G2: 'E2',
  A2: 'A2',
  B2: 'A2',
  C3: 'A2',
  D3: 'D3',
  E3: 'D3',
  'F#3': 'D3',
  G3: 'G3',
  A3: 'G3',
  B3: 'B3',
  C4: 'B3',
  D4: 'B3',
  E4: 'E4',
  'F#4': 'E4',
  G4: 'E4'
};

const initialSpread = 5;
const OFFSETS = {
  E2: Math.random() * initialSpread - initialSpread / 2,
  A2: Math.random() * initialSpread - initialSpread / 2,
  D3: Math.random() * initialSpread - initialSpread / 2,
  G3: Math.random() * initialSpread - initialSpread / 2,
  B3: Math.random() * initialSpread - initialSpread / 2,
  E4: Math.random() * initialSpread - initialSpread / 2
}

const SCALE_OFFSETS = {
  E2: Math.round(Math.random() * 1),
  A2: Math.round(Math.random() * 1),
  D3: Math.round(Math.random() * 1),
  G3: Math.round(Math.random() * 1),
  B3: Math.round(Math.random() * 1),
  E4: Math.round(Math.random() * 1)
}

const SCALE_NOTES = {
  E2: ['E2', 'G2'], //['E2', 'F#2', 'G2'],
  A2: ['A2', 'B2'],//['A2', 'B2', 'C3'],
  D3: ['D3', 'E3'],//['D3', 'E3', 'F#3'],
  G3: ['G3', 'A3'],
  B3: ['B3', 'D4'], //['B3', 'C4', 'D4'],
  E4: ['E4', 'G4'] // ['E4', 'F#4', 'G4']
}

const tunerStroke = d3.scaleThreshold().domain([0.1, 0.5, 2]).range(['#7ED321', '#F8E71C', '#D0021B'])
const tunerFill = d3.scaleThreshold().domain([0.1, 0.5, 2]).range(['#7ED321', '#CED3D6'])

class Guitar extends React.Component {

  constructor(props) {
    super(props);
    this.zoomTo = this.zoomTo.bind(this);
    this.resetZoom = this.resetZoom.bind(this);
    this.tunerDragStart = this.tunerDragStart.bind(this);
    this.tunerDrag = this.tunerDrag.bind(this);
    this.tunerDragEnd = this.tunerDragEnd.bind(this);
    this.setTuningNote = this.setTuningNote.bind(this);
    this.removeTuningNote = this.removeTuningNote.bind(this);
    this.playNote = this.playNote.bind(this);

    this.state = {
      shouldLoad: !isMobile(),
      isLoading: true,
      mounted: false
    }
  }

  isInTune() {
    const totalOffkey = Object.keys(OFFSETS).reduce((memo, note) => {
      return memo && Math.abs(OFFSETS[note]) < 0.1;
    }, true);
    console.log('totalOffkey: ', totalOffkey);
    return totalOffkey;
  }

  setZoom(state) {
    this.resetZoom()
      .on('end', () => {
        switch(state) {
          case 'headstock':
            this.zoomTo(d3.select(this.ref).select('.zoomable.headstock'));
            break;
          case 'pickups':
            this.zoomTo(d3.select(this.ref).select('.zoomable.pickups'));
            break;
          default:
            break;
        }
      })

  }
  setOverlays(state) {
    switch(state) {
      case 'headstock':
        d3.select(this.ref).selectAll('.overlay.headstock').attr('opacity', 1);
        break;
      case 'pickups':
      d3.select(this.ref).selectAll('.overlay.pickups').attr('opacity', 1);
        break;
      default:
        d3.select(this.ref).selectAll('.overlay').attr('opacity', 0);
    }
  }

  playNote(note, hide, skipReference) {

    const sampler = this.props.clean ? this.cleanSampler : this.sampler;
    let freq, centerFreq;
    if (false && !skipReference && this.props.playScale) {
      sampler.volume.value = -6;
      console.log('playScale = true')
      console.log(SCALE_OFFSETS[note]);
      console.log(SCALE_NOTES[note])
      console.log(SCALE_NOTES[note][SCALE_OFFSETS[note]])
      freq = FREQUENCIES[SCALE_NOTES[note][SCALE_OFFSETS[note]]];
      console.log(freq);
      centerFreq = FREQUENCIES[note];
      SCALE_OFFSETS[note] = (SCALE_OFFSETS[note] + 1) % SCALE_NOTES[note].length;
      console.log(SCALE_OFFSETS)
      sampler.triggerAttackCentered(freq, centerFreq);
    } else {
      sampler.volume.value = -3;
      freq = FREQUENCIES[note] + Math.random() * freqSpread - freqSpread / 2 + OFFSETS[note];
      centerFreq = FREQUENCIES[note]
      sampler.triggerAttackCentered(freq, centerFreq);
    }
    if (!skipReference && this.props.playReference) {
      setTimeout(() => {
        sampler.triggerAttackCentered(centerFreq, centerFreq);
      }, 250);
    }

    if (!hide) {
      // d3.select(this.ref).select(`.tuner-knob.${note.toLowerCase()}`).attr('fill', '#B8E986').transition().delay(50).duration(100).attr('fill', '#CED3D6')

      d3.select(this.ref).selectAll(`.string`).filter(function(d) {
        return d3.select(this).attr('id').indexOf(note.toLowerCase()) > -1;
      }).attr('stroke-width', 10).attr('stroke', '#50E3C2').transition().delay(50).duration(100).attr('stroke', '#968F8F').attr('stroke-width', 4)
    }


    this.props.updateProps({
      currentFrequency: freq,
      targetNote: note
    })
  }

  setTuningNote(note) {
    console.log('setting ', note);
    if (this.isTuning && this.isTuning === note) {
      console.log('returning')
      return;
    }

    if (this.isTuning) {
      clearInterval(this.tuningInterval);
    }
    this.tuningInterval = setInterval(() => { this.playNote(note) }, 750);
    this.playNote(note);
    this.isTuning = note;
  }

  removeTuningNote() {
    this.isTuning = false;
    clearInterval(this.tuningInterval);
  }

  tunerDragStart(note) {
    // d3.event.stopPropagation();
    return () => {
      this.isDragging = true;
      this.setTuningNote(note);
      // console.log('drag drag ', d3.event.dy);
      // offset += d3.event.dy * 3;
    }
    // this.pitchShifter.pitch = this.pitchShifter.pitch + dy;

    // console.log(this.pitchShifter.pitch);
  }
  tunerDrag(note) {
    // d3.event.stopPropagation();

    const tunerKnob = d3.select(this.ref).select(`.${note.toLowerCase()}.tuner-knob`)

    return () => {
      // this.setTuningNote(note);

      const dy = this._lastY - d3.event.dy;
      // console.log('drag drag ', d3.event.dy);
      offset += dy * 3;

      tunerKnob

      this._lastY = d3.event.y;


    }
    // this.pitchShifter.pitch = this.pitchShifter.pitch + dy;

    // console.log(this.pitchShifter.pitch);
  }

  tunerDragEnd() {
    this.isDragging = false;
    this.removeTuningNote();
    // d3.event.stopPropagation();
    // const dy = d3.event.dy;
    // offset += dy;
    // console.log('ending drag, offset ', offset);
  }

  resetZoom() {
    const curSelect = this.selected;
    this.selected = null;

    d3.select(this.ref).selectAll('.zoomable > .rect').attr('stroke-width', 3);
    console.log('resetting zoom with duration ', curSelect ? 1000 : 0, ' selected ', this.selected)
    return d3.select(this.ref)
      .selectAll('.container')
      .transition()
      .duration(curSelect ? 1000 : 0)
      .attr('transform', this.containerTransform);
  }

  zoomTo($el) {
    const $rect = $el.select('.rect');
    $rect.attr('stroke-width', 0);
    const transform = getAbsoluteSVG($rect);

    d3.select(this.ref)
      .selectAll('.container')
      .transition()
      .duration(1000)
      .attr('transform', this.getTransform(transform.x, transform.y, transform.width, transform.height));

    this.selected = $el;
  }

  onLoad(src) {
    let Tone;
    let listener;
    try {
      Tone = require('./lib/tone');
      if (listener) {
        window.removeEventListener('click', listener);
      }
    } catch (e) {
      if (alert('It looks like Chrome audio autoplay is giving us troubles. Close this and tap the loading bar to continue loading audio.')) {
        listener = window.addEventListener('click', () => {
          this.onLoad();
        })
        return;
      }
    }

    if (!this.ref) {
      return;
    }

    const loadingBar = d3.select(this.ref).select('#loading-bar');

    loadingBar.transition().duration(500).attr('width', 100 - 100 / Math.pow(isMobile() ? 1.25 : 2));

    const self = this;
    this.selected = null;
    const svg = d3.select(this.ref).select('.guitar-svg-el').style('display', 'none');
    this.containerTransform = svg.select('.container').attr('transform');

    let intervalCount = 1;
    let loadingInterval = setInterval(() => {
      intervalCount++;
      loadingBar.transition().duration(500).attr('width', 100 - 100 / Math.pow(isMobile() ? 1.25 : 2, intervalCount));
    }, 1000)


    svg.on('click', function() {
      if (isMobile()) {
        d3.event.stopPropagation();
      }
    })
    // const pitchShifter = this.pitchShifter = new Tone.PitchShift().toMaster();

    // pitchShifter.windowSize = .03;
    const fft = this.fft = new Tone.FFT(Math.pow(2, 9));

		//get the waveform data for the audio
		const waveform = this.waveform = new Tone.Waveform(1024);

    const sampler = this.sampler = new Tone.Sampler({
      "E2" : "data/samples/E2.wav",
      "A2" : "data/samples/A2.wav",
      "D3" : "data/samples/D3.wav",
      "G3" : "data/samples/G3.wav",
      "B3" : "data/samples/B3.wav",
      "E4" : "data/samples/E4.wav"
    }, () => {
      clearInterval(loadingInterval);
      loadingBar.attr('width', 100);
      d3.select(this.ref).select('.loader').style('display', 'none');
      svg.style('display', 'block');
      sampler.release = 100;
      sampler.volume.value = -3;

      this.props.updateProps({ fft, waveform });

      const cleanSampler = this.cleanSampler = new Tone.Sampler({
        "E2" : "data/samples/clean/E2.wav",
        "A2" : "data/samples/clean/A2.wav",
        "D3" : "data/samples/clean/D3.wav",
        "G3" : "data/samples/clean/G3.wav",
        "B3" : "data/samples/clean/B3.wav",
        "E4" : "data/samples/clean/E4.wav"
      }, () => {
        cleanSampler.release = 100;
      }).fan(fft, waveform).toMaster();

      // - UNCOMMENT IF WE WANT NOISE ON PAGELOAD
      // Object.keys(OFFSETS).forEach((note, i) => {
      //   setTimeout(() => {
      //     this.playNote(note)
      //   }, Math.round(Math.random() * 6) * 150);
      // })

      const self = this;
      const $strings = d3.select(this.ref)
      .selectAll('.string')
      .on('mouseenter', function() {
        const $this = d3.select(this);

        const note = $this.attr('id').split('___')[0].replace(/#/g, '').toUpperCase();
        self.playNote(note);

        // $this
        //   .attr('stroke-width', 10)
        //   .attr('stroke', '#50E3C2');
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('stroke', '#968F8F');
      })

      .on('click', function() {
        const $this = d3.select(this);

        const note = $this.attr('id').split('___')[0].replace(/#/g, '').toUpperCase();
        self.playNote(note);
      })

      d3.select(this.ref).selectAll('.tuner')
        // .on('click', function() {
        //   d3.event.stopPropagation();
        // })
        .on('mouseleave', function() {
          if (!self.isTuning) {
            d3.select(this).attr('stroke-width', 0);
          } else if(!self.isDragging) {
            d3.select(this).attr('stroke-width', 0);
            self.removeTuningNote();
          }
        })
        .each(function() {
          const $this = d3.select(this);
          const note = $this.attr('class').replace(/tuner/g, '').trim().toUpperCase();

          $this.on('mouseenter', function() {
            if (!self.isTuning) {
              d3.select(this).attr('stroke', '#50E3C2').attr('stroke-width', 2);
              self.setTuningNote(note);
            }
          })

          const tunerKnob = d3.select(self.ref).select(`.tuner-knob.${note.toLowerCase()}`);
          $this.call(d3.drag()
            .on('start', self.tunerDragStart(note))
            // .on("drag", self.tunerDrag(note))
            .on("drag", function() {
              console.log(d3.event);
              OFFSETS[note] += d3.event.dx / 20;
              if (self.props.tunerVisualization) {
                tunerKnob.attr('stroke', tunerStroke(Math.abs(OFFSETS[note])));
              }
              tunerKnob.attr('fill', tunerFill(Math.abs(OFFSETS[note])));
              self.props.updateProps({
                isInTune: self.isInTune()
              });
            })
            .on("end", function() {
              d3.select(this).attr('stroke-width', 0);
              self.tunerDragEnd();
            }))
        })

    }).fan(fft, waveform).toMaster();



    const $zoomables = this.$zoomables = d3.select(this.ref)
      .selectAll('.zoomable')
      .style('cursor', 'pointer')
      // .on('mouseenter', function() {
      //   // console.log('in zoomable')
      //   // d3.select(this)
      //   //   .select('.rect')
      //   //   // .transition()
      //   //   .attr('opacity', 1);
      // })
      // .on('mouseleave', function() {
      //   // d3.select(this)
      //   //   .select('.rect')
      //   //   // .transition()
      //   //   .attr('opacity', 0);
      // });

    $zoomables
      .on('click', function() {
        if (isMobile()) {
          return false;
        }
        if (self.isTuning) {
          console.log('remove')
          self.removeTuningNote();
          return;
        }
        console.log('not tuning', self.isTuning);
        d3.event.stopPropagation();
        const $el = d3.select(this);
        if( self.selected && $el.node() === self.selected.node() ) {
          self.resetZoom();
          return;
        }
        self.zoomTo($el);
      })
  }

  shouldComponentUpdate(newProps, newState) {

    if (newState.shouldLoad !== this.state.shouldLoad) {
      return true;
    }
    return false;
  }

  updateState(state) {
    this.setZoom(state);
    this.setOverlays(state);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.state !== this.props.state) {
      this.updateState(newProps.state);
    }

    d3.select(this.ref).classed(this.props.state, false);
    d3.select(this.ref).classed(newProps.state, true);

    if (newProps.playRiff && !this.props.playRiff) {
      const totalNotes = Object.keys(FREQUENCIES).length;
      console.log('PLAYING RIFF')
      Object.keys(FREQUENCIES).forEach((key, i) => {
        const freq = FREQUENCIES[key];
        const sampler = newProps.clean ? this.cleanSampler : this.sampler;
        setTimeout(() => {
          sampler.triggerAttack(FREQUENCIES[key]);
          d3.select(this.ref).selectAll(`.string`).filter(function(d) {
            return d3.select(this).attr('id').indexOf(BASE_FREQUENCIES[key].toLowerCase()) > -1;
          }).attr('stroke-width', 10).attr('stroke', '#50E3C2').transition().delay(50).duration(100).attr('stroke', '#968F8F').attr('stroke-width', 4)
        }, i * 250);
        setTimeout(() => {
          sampler.triggerAttack(FREQUENCIES[key]);
          d3.select(this.ref).selectAll(`.string`).filter(function(d) {
            return d3.select(this).attr('id').indexOf(BASE_FREQUENCIES[key].toLowerCase()) > -1;
          }).attr('stroke-width', 10).attr('stroke', '#50E3C2').transition().delay(50).duration(100).attr('stroke', '#968F8F').attr('stroke-width', 4)
        }, 250 * totalNotes + 250 + 250 * (totalNotes - i) );
      })
      setTimeout(() => {
        this.props.updateProps({ playRiff: false });
      }, 250 * totalNotes + 250 + 250 * (totalNotes) + 100)
    }

    if (newProps.detuneGuitar && this.props.detuneGuitar === false) {
      Object.keys(OFFSETS).forEach((note, i) => {
        OFFSETS[note] = Math.random() * initialSpread - initialSpread / 2;
        setTimeout(() => {
          this.playNote(note, false)
        }, Math.round(Math.random() * 6) * 150);
      })
      d3.select(this.ref).selectAll('.tuner-knob').attr('stroke', 'none').attr('fill', '#CED3D6');
      this.props.updateProps({ detuneGuitar: false });
    }
    if (newProps.autotuneGuitar && this.props.autotuneGuitar === false) {
      Object.keys(OFFSETS).forEach((note, i) => {
        OFFSETS[note] = 0;
      })
      d3.select(this.ref).selectAll('.tuner-knob').attr('fill', '#7ED321').transition().delay(100).duration(100).attr('stroke', 'none').attr('fill', '#CED3D6');
      this.props.updateProps({ autotuneGuitar: false });
    }
    if (newProps.playNotes && newProps.playNotes !== this.props.playNotes) {
      newProps.playNotes.split(':').forEach((note, i) => {
        setTimeout(() => {
          console.log('NOTE: ', note);
          this.playNote(note, false, true);
        }, 500 * i);
      })
      this.props.updateProps({ playNotes: false });
    }

    if (newProps.playBeats && newProps.playBeats !== this.props.playBeats) {
      const sampler = newProps.clean ? this.cleanSampler : this.sampler;
      sampler.release = 20;
      sampler.triggerAttackCentered(FREQUENCIES['E4'], FREQUENCIES['E4']);
      setTimeout(() => {
        sampler.triggerAttackCentered(FREQUENCIES['E4'] + newProps.beatDiff, FREQUENCIES['E4']);
        sampler.release = 100;
      }, 100)
      this.props.updateProps({ playBeats: false });
    }
  }

  getTransform(x, y, w, h) {
    const width = 670;
    const height = 1359;
    const scale = Math.max(width / w, height / h);
    const translate = [width / 2 - scale * (x + w / 2), height / 2 - scale * (y + h / 2)];
    return `translate(${translate.join(',')})scale(${scale})`;
  }

  renderMobileWarning() {
    return <Portal>
      <div className="mobile-warning">
        We noticed you're using a mobile device: this interactive site
        will download about 30MB of audio samples. If this is okay, click to continue - otherwise
        visit on WiFi or on a laptop or desktop device.
        <br/>
        <br/>
        Make sure to turn your audio on.
        <div className="mobile-load-confirm" onClick={() => {
          this.setState({ shouldLoad: true })
        }}>
          Continue
        </div>
      </div>
    </Portal>
  }

  render() {
    const { hasError, updateProps, ...props } = this.props;

    return (
      <div id='guitar-svg' ref={(_ref) => this.ref = _ref} >
        {
          this.state.isLoading ?
          <div className="loader">
            <div>
              <svg style={{width: 100, height: 10, display: 'block', margin: '20px auto'}}>
                <rect x={0} y={0} width={100} height={10} fill={"#DDD"} />
                <rect id="loading-bar" x={0} y={0} width={0} height={10} fill={"#7ED321"} />
              </svg>
            </div>
            Loading audio...
          </div> : null
        }
        {
          this.state.shouldLoad ? <SVG className="guitar-svg-el" src={props.src}
          onLoad={(src) => {
              this.onLoad(src);
          }} /> : this.renderMobileWarning()
        }
      </div>
    );
  }
}

module.exports = Guitar;
