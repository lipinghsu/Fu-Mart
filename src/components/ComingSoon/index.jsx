import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductsStart } from "../../redux/Products/products.actions";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import cornerImg from '../../assets/corner-image.jpg';
import Header from './../Header';
// import Product from "./Product";
// import SkeletonProduct from "./SkeletonProduct";
// import FormSelect from "../forms/FormSelect";
// import LoadMore from "../LoadMore";
// import filterImage from "../../assets/filterImage.png";

import "./ComingSoon.scss";

// const mapState = ({ productsData }) => ({
    // products: productsData.products,
    // loading: productsData.loading,
// });

const ComingSoon = () => {
    const { t } = useTranslation(['comingsoon', 'common']);
    // const dispatch = useDispatch();
    // const navigate = useNavigate(); 
    // const { filterType } = useParams();
    // const { products, loading } = useSelector(mapState);
    // const { data = [], queryDoc, isLastPage } = products;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // useEffect(() => {
        // dispatch(fetchProductsStart({ filterType }));
    // }, [filterType, dispatch]);

    // if (!Array.isArray(data)) {
    //     return null;
    // }

    // if (data.length < 1 && !loading) {
    //     return (
    //         <div className="products">
    //             <p>No results.</p>
    //         </div>
    //     );
    // }

    // const handleFilter = (e) => {
    //     const nextFilter = e.target.value;
    //     navigate(`/search/${nextFilter}`);  // ✅ updated to navigate
    // };

    // const configFilters = {
    //     defaultValue: filterType,
    //     image: filterImage,
    //     options: [
    //         { name: "Show All", value: "" },
    //         { name: "Mens", value: "mens" },
    //         { name: "Womens", value: "womens" },
    //     ],
    //     handleChange: handleFilter,
    // };

    // const handleLoadMore = () => {
    //     dispatch(
    //         fetchProductsStart({
    //             filterType,
    //             startAfterDoc: queryDoc,
    //             persistProducts: data,
    //         })
    //     );
    // };

    // const configLoadMore = {
    //     onLoadMoreEvent: handleLoadMore,
    // };

    return (
        <div className="products">
            <Header 
                title={t('title')} 
                subtitle={t('cs-subtitle')} 
                comingSoonPage={true}
            />
            <div className="corner-decoration top-left">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration top-right">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration bottom-left">
                <img src={cornerImg} alt="Corner" />
            </div>
            <div className="corner-decoration bottom-right">
                <img src={cornerImg} alt="Corner" />
            </div>


            <div className="coming-soon-wrap">
                <div className="coming-soon-wrap-top">
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                <div className="coming-soon solid top-text">{t('comingSoon')}</div>
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>
                <div className="coming-soon outline top-text">{t('comingSoon')}</div>

                <div className="coming-soon solid subtitle">{t('haveANiceDay')}</div>
            </div>
            <div className="coming-soon solid notice">{t('noticeTitle')}</div>
            <div className="coming-soon solid sub-text">{t('noticeDescription')}</div>
            <div className="coming-soon solid sub-text"></div>
            <div className="coming-soon solid subtitle ty">{t('thankYou')}</div>
 
                    
        </div>
            {/* <FormSelect {...configFilters} /> */}

            {/* <div className="productResults">
                {loading
                    ? Array.from({ length: 6 }).map((_, idx) => (
                          <SkeletonProduct key={idx} />
                      ))
                    : data.map((product, pos) => {
                          const {
                              productThumbnail,
                              productName,
                              productPrice,
                              downloadUrls,
                          } = product;

                          if (
                              !productThumbnail ||
                              !productName ||
                              typeof productPrice === "undefined" ||
                              !downloadUrls
                          ) {
                              return null;
                          }

                          const configProduct = { ...product };
                          return <Product key={pos} {...configProduct} />;
                      })}
            </div> */}

            {/* {!isLastPage && !loading && <LoadMore {...configLoadMore} />} */}
        </div>
    );
};

export default ComingSoon;
