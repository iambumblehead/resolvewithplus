import libindex1 from 'nodejsexample_01_exports';
import libindex2 from 'nodejsexample_01_exports/lib';
import libindex3 from 'nodejsexample_01_exports/lib/index';
import libindex4 from 'nodejsexample_01_exports/lib/index.js';

import featureindex1 from 'nodejsexample_01_exports/feature';
import featureindex2 from 'nodejsexample_01_exports/feature/index';
import featureindex3 from 'nodejsexample_01_exports/feature/index.js';

const libindex1wrap = () => libindex1
const libindex2wrap = () => libindex2
const libindex3wrap = () => libindex3
const libindex4wrap = () => libindex4

const featureindex1wrap = () => featureindex1
const featureindex2wrap = () => featureindex2
const featureindex3wrap = () => featureindex3

export {
  libindex1wrap,
  libindex2wrap,
  libindex3wrap,
  libindex4wrap,

  featureindex1wrap,
  featureindex2wrap,
  featureindex3wrap
};
