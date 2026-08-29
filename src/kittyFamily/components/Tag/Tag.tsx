// @ts-nocheck
import React from 'react';
// import IconsComponent from 'kittyFamily/components/Icons/IconsComponent';
import { grey } from 'kittyFamily/style/config';
import { icons } from './icons';
import * as Styled from './Tag.style';

// const getTagImage = (_tag, searchables) => {
//   let icon = false;
//   if (_tag.split(':').length > 1) {
//     const _tagType = _tag.split(':')[0];
//     const _tagDescription = _tag.split(':')[1];
//     if (_tagType === 'type') {
//       icon = icons['type'][_tagDescription];
//     } else {
//       if (_tagType === 'mewtation') {
//         icon = icons[_tagType][_tagDescription];
//       } else {
//         if (_tagType === 'cooldown') {
//           icon = { icon: 'cooldown' };
//         } else {
//           if (icons[_tagType]) {
//             icon = icons[_tagType];
//           }
//         }
//       }
//     }
//   }

//   // TODO: refactor from mocked legacy implementation
//   const cattributeItems = [].find(({ key }) => key === 'cattributes')?.items;
//   const colorCattributeItems = [].find(({ key }) => key === 'colorCattributes')?.items;

//   const image = [cattributeItems, colorCattributeItems].find((items, i) => {
//     return items?.subitems?.find((item) => item.key === _tag);
//   });

//   return icon ? (
//     icon.icon ? (
//       <IconsComponent iconName={icon.icon} color={grey[500]} />
//     ) : (
//       <img src={icon} alt={''} style={{ width: '16px', height: '16px' }} />
//     )
//   ) : image ? (
//     <IconsComponent iconName={image.icon} color={grey[500]} />
//   ) : (
//     <IconsComponent iconName={'search'} color={grey[500]} />
//   );
// };

const Tag = ({ tag, searchables, onRemove, onSetPureBred, pureBred }) => {
  const _tag = tag.trim();
  const _type = _tag.split(':');
  const tags =
    _type.length > 1
      ? _type[0] === 'mewtation' || _type[0] === 'cooldown' || _type[0] === 'terms'
        ? _type[1].split(',')
        : [_tag]
      : [_tag];
  return (
    !(_tag === 'type:normal' || _tag === '') &&
    tags.map((t, i) => {
      const _displayName = tags.length > 1 ? `${_type[0]}:${t}` : _type.length > 1 ? `${_type[0]}:${_type[1]}` : t;
      const displayName = _displayName.replace('terms:', '');
      return (
        <Styled.P key={i}>
          {/* {getTagImage(displayName, searchables)} */}
          <b>{displayName}</b>
          {_displayName.includes('terms:') && <label>pb:<input type='checkbox' checked={pureBred.includes(t)} onChange={() => onSetPureBred(t)} /></label>}
          <span onClick={() => onRemove(displayName)} role={'button'}>
            {'X'}
          </span>
        </Styled.P>
      );
    })
  );
};

export default Tag;
