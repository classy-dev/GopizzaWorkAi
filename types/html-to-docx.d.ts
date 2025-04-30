declare module 'html-to-docx' {
  interface HtmlToDocxOptions {
    title?: string;
    header?: boolean | string;
    footer?: boolean | string;
    pageNumber?: boolean;
    baseUrl?: string;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    table?: {
      row?: {
        cantSplit?: boolean;
      };
    };
    lineBreak?: boolean;
    font?: string;
    fontSize?: number;
    orientation?: 'landscape' | 'portrait';
  }

  function HTMLtoDOCX(
    htmlString: string,
    options?: HtmlToDocxOptions,
    headerHTMLString?: string,
    footerHTMLString?: string
  ): Promise<Buffer>;

  export = HTMLtoDOCX;
}
