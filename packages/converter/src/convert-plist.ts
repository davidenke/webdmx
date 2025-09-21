import type { Preset } from '@webdmx/common';
import type { PlistObject } from 'plist';
import plist from 'plist';

type PlistData = PlistObject & {
  $objects: readonly (PlistObject & {
    $class: string;
    $classname: string;
    $objects: readonly PlistObject[];
  })[];
  $class: string;
  $classname: string;
  $label: string;
  $name: string;
  // options: PlistObject;
  // $from: number;
  // $to: number;
  // $step: number;
  // $value: number;
};

export function convertPlistToPreset(plistData: string): Preset {
  // as a commonjs module, we need to import the default export

  const parsedData = plist.parse(plistData) as PlistData;
  const preset: Preset = {
    label: `${parsedData.$name}`,
    profiles: {},
    controls: {},
  };

  // Parse profiles
  const profiles = parsedData.$objects.filter(
    obj => obj.$class && obj.$class === 'LXFixtureProfile'
  );
  profiles.forEach(profile => {
    const channels = profile.$objects.filter(
      obj => obj.$class && obj.$class === 'LXFixtureChannel'
    );
    const channelLabels = channels.map(channel => `${channel.$label}`);
    preset.profiles[profile.$classname] = {
      label: `${profile.$label}`,
      channels: channelLabels,
    };
  });

  // Parse controls
  // const controls = parsedData.$objects.filter((obj) => obj.$class && obj.$class === 'LXControl');
  // controls.forEach((control) => {
  // const controlType = control.$class.split('.').pop();
  // if (controlType === 'LXOptionControl') {
  //   const options = control.options.$objects.map((option) => {
  //     if (option.$class.split('.').pop() === 'LXSlider') {
  //       return {
  //         label: option.$label,
  //         from: option.$from,
  //         to: option.$to,
  //         step: option.$step,
  //       } as Slider;
  //     } else {
  //       return {
  //         label: option.$label,
  //         value: option.$value,
  //       } as Option;
  //     }
  //   });
  //   preset.controls[control.$label] = {
  //     type: 'options',
  //     options,
  //   } as Control;
  // } else if (controlType === 'LXSliderControl') {
  //   preset.controls[control.$label] = {
  //     type: 'slider',
  //     label: control.$label,
  //     from: control.$from,
  //     to: control.$to,
  //     step: control.$step,
  //   } as Control;
  // }
  // });

  return preset;
}
