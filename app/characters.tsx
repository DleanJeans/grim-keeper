import { Stack } from 'expo-router';
import { CharacterRoleList } from '@/components/characters/character-role-list';
import { TitleHeader } from '@/components/title-header';

export default function CharactersRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title="Characters" />,
          title: 'Characters',
        }}
      />
      <CharacterRoleList />
    </>
  );
}
