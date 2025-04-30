import { makeAutoObservable } from 'mobx';
import { DocumentStore } from './DocumentStore';
import { UIStore } from './UIStore';
import { TranslationStore } from './TranslationStore';

// 클래스를 기본 내보내기로 변경
class RootStore {
  documentStore: DocumentStore;
  uiStore: UIStore;
  translationStore: TranslationStore;

  constructor() {
    this.documentStore = new DocumentStore(this);
    this.uiStore = new UIStore(this);
    this.translationStore = new TranslationStore(this);

    makeAutoObservable(this);
  }
}

export default RootStore;

// 싱글톤 인스턴스 제거 (React Context를 통해 단일 인스턴스를 제공하도록 변경)
