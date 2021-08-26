/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  // const totalWords = post.data.content.reduce((total, contentItem) => {
  //   total += contentItem?.heading.split(' ').length;

  //   const words = contentItem?.body.map(item => item.text.split(' ').length);
  //   words.map(word => (total += word));
  //   return total;
  // }, 0);
  // const readTime = Math.ceil(totalWords / 200);

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
        {content.map(paragraph => (
          <article className={styles.article} key={paragraph.body[0].text}>
            <h2>{paragraph.heading}</h2>
            {paragraph.body.map(body => (
              <p key={body.text}>{body.text}</p>
            ))}
          </article>
        ))}
      </div>
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

export const getStaticProps: GetStaticProps = async context => {
  const uid = context.params.slug;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', `${uid}`, {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    },
  };
};
