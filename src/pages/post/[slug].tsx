/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/dist/client/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Comments from '../../components/Comments';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  const totalWords = post.data.content.reduce((acc, item) => {
    if (item.heading) {
      acc += item.heading.split(' ').length;
    }
    if (item.body) {
      item.body.map(body => {
        acc += body.text.split(' ').length;
        return true;
      });
    }
    return acc;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);
  const { content } = post.data;
  return (
    <>
      <Head>
        <title>{post?.data.title}</title>
      </Head>
      <Header />
      <img src={post?.data.banner.url} alt="banner" className={styles.banner} />
      <div className={`${styles.post} ${commonStyles.container}`}>
        <h1>{post?.data.title}</h1>
        <div className={styles.description}>
          <span>
            <FiCalendar />{' '}
            {format(new Date(post?.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>
          <span>
            <FiUser /> {post?.data.author}
          </span>
          <span>
            <FiClock /> {readTime} min
          </span>
        </div>

        <span className={styles.lastUpdate}>
          * editado em{' '}
          <span>
            {format(new Date(post?.last_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>{' '}
          às{' '}
          <span>
            {format(new Date(post?.last_publication_date), 'hh:mm', {
              locale: ptBR,
            })}
          </span>
        </span>
        {content.map(paragraph => (
          <article className={styles.article} key={paragraph.body[0].text}>
            <h2>{paragraph.heading}</h2>
            {paragraph.body.map(body => (
              <p key={body.text}>{body.text}</p>
            ))}
          </article>
        ))}
        <hr />
      </div>

      <div className={styles.prevAndNextPost}>
        {!navigation.prevPost[0] ? (
          <span> </span>
        ) : (
          <span className={styles.prevPost}>
            <p>{navigation.prevPost[0]?.data.title}</p>
            <Link href={`/post/${navigation.prevPost[0]?.uid}`}>
              <a>Post anterior</a>
            </Link>
          </span>
        )}
        {!navigation.nextPost[0] ? (
          <span> </span>
        ) : (
          <span className="NextPost">
            <p>{navigation.nextPost[0]?.data.title}</p>
            <Link href={`/post/${navigation.nextPost[0]?.uid}`}>
              <a>Próximo post</a>
            </Link>
          </span>
        )}
      </div>
      <Comments />

      {preview && (
        <aside className={styles.previewButton}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const post = {
    uid: slug,
    first_publication_date: response?.first_publication_date,
    last_publication_date: response?.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
    revalidate: 3600,
  };
};
