declare module '@asseinfo/react-kanban' {
  import { FC } from 'react';

  interface ProjectItem {
    projectId: string;
    contentId: string;
    title: string;
    number: number;
    labels: {
      nodes: Array<{
        id: string;
        name: string;
        color: string;
      }>;
    };
    content: {
      url: string;
    };
  }

  interface Column {
    id: string;
    title: string;
    cards: ProjectItem[];
  }

  interface Board {
    columns: Column[];
  }

  interface BoardProps {
    children: Board;
    disableColumnDrag?: boolean;
    renderCard?: (card: ProjectItem) => JSX.Element;
    renderColumn?: (column: Column) => JSX.Element;
  }

  const Board: FC<BoardProps>;
  export default Board;
}