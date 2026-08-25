import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowUpDown,
  Award, 
  Layers, 
  Gamepad2, 
  Crosshair, 
  Lock, 
  TrendingUp, 
  PieChart, 
  ChevronLeft, 
  ChevronRight, 
  Crown, 
  Flame,
  Sparkles,
  Search,
  Calendar,
  Clock,
  Timer,
  Zap,
  Trophy,
  XCircle,
  CheckCheck,
  Clover,
  ArrowRight,
  Info
} from "lucide-react";
import { useUser } from "../components/Shared/UserContext";
import { useLoading } from "../components/Shared/LoadingContext";
import { LoadingSpinner, SectionLoader, InlineLoader } from "../components/Shared";
import { Button } from "../components/Shared/Button";
import Modal from "../components/Shared/Modal";
import { profileAPI, caughtAPI } from "../utils/api";
import { calculateDetailedStats, calculateHuntStats } from "../utils/detailedStatsUtils";
import { getSpriteUrl } from "../utils/spriteUtils";
import { formatPokemonName } from "../utils";
import pokemonData from "../data/pokemon.json";
import formsData from "../utils/loadFormsData";
import { calculateOdds } from "../utils/huntSystem";
import { getUserAvatarUrl } from "../utils/profileUtils";
import SelectField from "../components/Shared/FormField/SelectField";
import SearchField from "../components/Shared/FormField/SearchField";
import { BALL_OPTIONS, MARK_OPTIONS } from "../Constants";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../css/ProfileStatsPage.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function ProgressRing({ percentage = 0, size = 52, strokeWidth = 5, color = "var(--accent)" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percentage || 0, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="stat-progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--progressbar-track)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="stat-progress-ring-text">{percentage}%</span>
    </div>
  );
}

function PokeballIcon({ size = 20, color = "var(--accent)", className = "" }) {
  return (
    <svg viewBox="0 0 980 978.94" width={size} height={size} fill={color} className={className} style={{ display: 'inline-block', flexShrink: 0 }}>
      <path d="M770,1224.85H732c-1.49-1-3.21-.74-4.85-.82-43.27-1.91-85.66-9.09-126.64-23.08-151.15-51.57-254.79-152.44-311.12-301.58-14.9-39.48-23.16-80.65-26.63-122.76-.55-6.76-.06-13.62-1.76-20.28v-43a58.81,58.81,0,0,0,.89-5.86,461,461,0,0,1,17.86-106.37q47-160.89,181.91-260.55C529.06,290.81,604.73,261,687.76,250a479.9,479.9,0,0,1,103.69-2.35c37.6,3.17,74.47,9.93,110.19,22q208.55,70.45,299,271.14c21.87,48.51,34.17,99.72,38.6,152.8.58,6.92.1,13.95,1.8,20.77v42c-.3,2.1-.78,4.2-.88,6.31A464.49,464.49,0,0,1,1222.35,869q-43.32,149.69-164.66,247.69Q941,1210.57,791.31,1223.07C784.21,1223.67,777,1223.05,770,1224.85ZM438.72,766.6h-96c-7.34,0-7.35,0-6.51,7.5a455.59,455.59,0,0,0,7.62,48.7q32.9,148.47,153,241.88c65.33,50.8,139.8,79.07,222.48,85.42,48.25,3.71,96,.07,142.34-13.67,136.22-40.33,229.87-127.25,281-259.63,12.92-33.47,19.88-68.48,23.33-104.17.33-3.46.83-6.17-4.62-6.16q-98,.3-196,0c-3.42,0-4.7,1.17-5.18,4.31-.71,4.59-1.53,9.17-2.63,13.68-27.08,111-135,180.24-247.43,158.68-85.94-16.48-153.58-85.58-168.15-171.85-.58-3.44-1.83-4.87-5.73-4.85C503.71,766.68,471.21,766.6,438.72,766.6Zm165.37-31.32C604.13,815.92,670.26,882,751,882s146.87-66,146.94-146.66S831.91,588.73,751,588.69,604.05,654.66,604.09,735.28Z" transform="translate(-261 -245.91)" />
    </svg>
  );
}

function Mastery100Icon({ size = 18, color = "var(--accent)", className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill={color} 
      className={className} 
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      <path d="M48.13 96.546l67.224-48.325c8.607-6.187 20.6-4.226 26.787 4.381a19.138 19.138 0 0 1 3.323 14.505l-.658 3.697a1997.235 1997.235 0 0 0-5.599 19.92l-5.461 20.077a3110.078 3110.078 0 0 0-10.527 40.286l-5.061 20.193l-4.924 20.221a2689.01 2689.01 0 0 0-4.773 20.249c-1.551 6.756-3.114 13.511-4.603 20.276c-1.517 6.762-2.975 13.53-4.43 20.3c-1.419 6.773-2.87 13.544-4.213 20.324c-1.385 6.777-2.69 13.561-3.994 20.345c-1.256 6.786-2.551 13.572-3.705 20.362c-1.212 6.79-2.303 13.58-3.408 20.372c-1.03 6.789-2.091 13.582-2.983 20.367a425.282 425.282 0 0 0-1.324 10.175c-.393 3.387-.869 6.785-1.19 10.163c-.342 3.38-.727 6.769-1.035 10.144l-.85 10.114l-.032.378c-.768 9.143-8.803 15.931-17.945 15.163c-9.024-.758-15.753-8.614-15.188-17.609l.685-10.775c.254-3.584.584-7.141.874-10.714c.27-3.579.69-7.108 1.03-10.664c.34-3.556.742-7.092 1.164-10.622c.787-7.079 1.739-14.104 2.662-21.141c.995-7.013 1.979-14.032 3.079-21.013c1.046-6.999 2.228-13.956 3.373-20.926c1.191-6.955 2.384-13.91 3.655-20.842c1.231-6.944 2.566-13.856 3.871-20.779c1.339-6.912 2.683-13.823 4.084-20.717c1.374-6.902 2.82-13.783 4.255-20.668c1.45-6.88 2.92-13.755 4.422-20.62l4.572-20.579l4.71-20.542a3157.67 3157.67 0 0 1 9.83-40.984l5.122-20.455a2028.126 2028.126 0 0 1 5.324-20.521l29.451 22.583l-74.71 35.675c-6.33 3.023-13.911.342-16.934-5.988c-2.69-5.637-.854-12.267 4.05-15.786z" />
      <path d="M320.185 187.858l-1.478 6.985l-.992 4.22l-.592 2.424l-.691 2.524a201.37 201.37 0 0 1-3.585 11.938c-2.965 8.864-7.11 19.498-13.325 31.102c-6.211 11.576-14.423 24.208-25.971 36.369c-5.829 6.043-12.574 11.909-20.623 17.039a75.228 75.228 0 0 1-13.299 6.662c-4.8 1.857-10.085 3.222-15.656 3.689c-1.37.192-2.801.165-4.209.209c-1.408.067-2.836-.038-4.263-.147c-.713-.056-1.426-.099-2.138-.176l-2.129-.345l-2.127-.369c.421.088-.878-.172-.809-.166l-.196-.053l-.392-.107l-.786-.214l-1.575-.428l-.41-.115l-.577-.192l-1.154-.385c-1.515-.52-3.16-1.075-4.375-1.682c-2.653-1.139-5.173-2.518-7.595-4.013c-4.825-3.019-9.197-6.611-12.939-10.624c-3.786-3.986-7.025-8.338-9.932-12.839c-5.766-9.035-9.979-18.766-13.323-28.746a175.473 175.473 0 0 1-7.124-30.754c-.776-5.228-1.271-10.486-1.619-15.771c-.266-5.277-.423-10.582-.272-15.876l.101-3.975l.229-3.967c.12-2.652.38-5.286.633-7.926c.234-2.643.593-5.266.928-7.897c.163-1.316.398-2.619.594-3.929l.666-4.172l.701-3.627l.35-1.813c.113-.596.23-1.201.388-1.898l.886-4.023c.294-1.35.59-2.684.934-3.948c.667-2.569 1.303-5.142 2.064-7.687l1.101-3.824l1.226-3.789c3.275-10.097 7.303-19.954 12.144-29.409c2.366-4.745 5.053-9.35 7.816-13.878c2.871-4.488 5.837-8.896 9.113-13.124c6.508-8.464 13.915-16.364 22.66-23.116c4.379-3.372 9.093-6.45 14.235-9.011c5.129-2.554 10.746-4.568 16.678-5.71c5.925-1.123 12.184-1.334 18.211-.393l1.129.171l.563.088l.281.045c-.029-.006 1.446.302.906.191l1.573.395l1.57.384c.718.205 1.612.494 2.404.752l2.429.831c.426.142.767.29 1.096.439l1.012.449c1.335.616 2.714 1.175 3.946 1.914c5.103 2.753 9.578 6.128 13.314 9.815c3.734 3.691 6.997 7.547 9.72 11.5c2.703 3.951 5.156 7.907 7.152 11.878c2.119 3.943 3.806 7.894 5.453 11.761c3.118 7.764 5.492 15.3 7.348 22.52a182.07 182.07 0 0 1 4.099 20.637c.257 1.629.454 3.231.632 4.808c.173 1.576.398 3.132.516 4.655c.245 3.048.511 5.995.606 8.819c.292 5.659.225 10.844.091 15.523c-.368 9.353-1.305 16.633-2.024 21.575l-1.27 7.547l-.048.26zm-39.302-7.437l1.06-6.421c.605-4.196 1.558-10.343 2.366-18.194c.807-7.842 1.624-17.404 1.651-28.326c.008-5.461-.235-11.256-.894-17.267c-.667-6.005-1.762-12.242-3.583-18.411c-1.826-6.136-4.406-12.223-7.858-17.535a42.117 42.117 0 0 0-5.818-7.113c-2.116-2.087-4.389-3.791-6.78-4.978c-.578-.369-1.204-.544-1.801-.824l-.45-.199c-.156-.074-.304-.14-.392-.15a6.551 6.551 0 0 1-.616-.191c-.227-.075-.344-.154-.656-.257l-1.579-.348l-1.586-.339c-.672-.138.686.137.509.109l-.121-.009l-.243-.019l-.484-.044c-2.57-.286-5.224-.13-7.994.576c-5.559 1.283-11.47 5.011-17.007 9.924c-5.519 5.008-10.593 11.36-15.106 18.363c-4.508 7.03-8.472 14.732-11.938 22.807c-1.774 4.014-3.33 8.176-4.888 12.346c-1.454 4.221-2.919 8.456-4.168 12.79l-.954 3.244l-.894 3.271c-.625 2.172-1.135 4.383-1.68 6.584a107.135 107.135 0 0 0-.765 3.236l-.728 3.184a37.954 37.954 0 0 0-.363 1.719l-.361 1.811l-.721 3.623l-.563 3.113c-.195 1.121-.429 2.238-.593 3.362c-.314 2.25-.771 4.486-1.051 6.738c-.625 4.497-1.237 8.998-1.65 13.498c-.907 8.998-1.393 17.992-1.306 26.87c.018 4.449.277 8.838.602 13.204c.418 4.334.919 8.649 1.705 12.834c.775 4.181 1.703 8.311 2.976 12.208c1.247 3.902 2.623 7.732 4.397 11.185c3.468 6.923 7.91 12.99 13.268 16.508c1.338.865 2.711 1.612 4.122 2.15c.761.369 1.237.401 1.785.599l.398.136l.198.069l.384.077l1.603.31l.8.155l.399.077l.2.039c.199.044-.963-.212-.409-.102l1.088.059l1.075.081c.361-.002.723-.031 1.081-.04c.716-.02 1.426-.011 2.144-.145c.716-.112 1.419-.118 2.134-.324c5.683-1.074 11.227-4.308 16.175-8.329c2.466-2.071 4.836-4.254 6.975-6.726c2.187-2.381 4.174-4.977 6.079-7.537c3.75-5.225 6.935-10.67 9.69-16.033c.671-1.358 1.369-2.665 1.996-4.004l1.84-3.965l1.674-3.924c.549-1.286 1.036-2.591 1.553-3.846c1.987-5.074 3.714-9.892 5.12-14.429c1.479-4.504 2.621-8.729 3.665-12.533c.981-3.827 1.843-7.248 2.497-10.254l.491-2.162l.383-1.919l.697-3.318l1.272-6.907l-.052.263z" />
      <path d="M498.905 156.987l-1.358 6.379l-.918 3.891l-.549 2.234l-.639 2.32a181.846 181.846 0 0 1-3.32 10.97c-2.746 8.146-6.592 17.914-12.361 28.57c-5.768 10.629-13.389 22.225-24.108 33.398c-5.41 5.554-11.673 10.945-19.155 15.674a70.002 70.002 0 0 1-12.379 6.142c-4.472 1.712-9.404 2.973-14.608 3.395c-1.279.175-2.617.148-3.932.186c-1.315.058-2.65-.042-3.983-.146c-.666-.054-1.333-.096-1.998-.17l-1.99-.327l-1.986-.351c.427.089-.866-.171-.792-.163l-.179-.049l-.358-.099l-.717-.198l-1.437-.396l-.376-.106l-.543-.18l-1.087-.363c-1.425-.489-2.977-1.018-4.106-1.582c-2.476-1.065-4.826-2.352-7.084-3.744c-4.498-2.811-8.572-6.141-12.055-9.857c-3.525-3.689-6.535-7.711-9.241-11.864c-5.365-8.336-9.288-17.293-12.421-26.472a161.276 161.276 0 0 1-6.712-28.278c-1.465-9.609-2.062-19.357-1.865-29.095l.082-3.655l.201-3.646c.104-2.438.337-4.86.566-7.286c.212-2.429.535-4.841.842-7.259c.149-1.21.363-2.407.542-3.611l.612-3.855l.639-3.311l.319-1.655a45.9 45.9 0 0 1 .356-1.74l.816-3.709c.271-1.245.543-2.474.86-3.635c.614-2.361 1.2-4.725 1.901-7.065l1.014-3.515l1.131-3.483c3.02-9.28 6.742-18.339 11.219-27.031c2.188-4.362 4.675-8.596 7.232-12.759c2.658-4.127 5.404-8.18 8.438-12.072c6.028-7.789 12.89-15.068 21.013-21.307c4.067-3.117 8.452-5.968 13.244-8.342c4.78-2.367 10.027-4.241 15.58-5.304c5.546-1.043 11.416-1.238 17.068-.351l1.059.162l.528.083l.264.042c-.048-.017 1.435.299.889.187l1.435.363l1.433.352c.673.192 1.523.464 2.271.708a93.86 93.86 0 0 1 2.296.786c.403.135.723.274 1.031.413l.948.42c1.251.577 2.542 1.104 3.695 1.794c4.777 2.581 8.957 5.735 12.438 9.17c3.478 3.44 6.513 7.024 9.043 10.689c2.511 3.662 4.789 7.323 6.643 10.991c1.969 3.643 3.536 7.288 5.07 10.852c2.903 7.156 5.125 14.092 6.871 20.736a167.6 167.6 0 0 1 3.882 18.984c.245 1.499.434 2.973.606 4.422c.167 1.45.382 2.881.498 4.282c.239 2.803.498 5.515.597 8.112c.292 5.205.246 9.975.136 14.279c-.317 8.603-1.172 15.298-1.833 19.841l-1.168 6.938l-.05.266zm-39.301-7.437l.958-5.812c.548-3.798 1.418-9.359 2.175-16.46c.759-7.092 1.549-15.739 1.659-25.617c.047-4.939-.128-10.18-.677-15.614c-.557-5.428-1.501-11.065-3.106-16.626c-1.606-5.531-3.904-11.003-6.966-15.74a36.889 36.889 0 0 0-5.14-6.301c-1.861-1.835-3.84-3.318-5.903-4.333c-.499-.321-1.038-.464-1.55-.704l-.387-.171c-.135-.064-.262-.121-.327-.125a4.143 4.143 0 0 1-.483-.146c-.183-.061-.255-.123-.522-.213l-1.441-.316l-1.448-.307c-.667-.137.698.14.526.112l-.104-.007l-.207-.015l-.414-.034a18.903 18.903 0 0 0-6.852.533c-4.795 1.126-10.002 4.444-14.917 8.849c-4.897 4.495-9.427 10.225-13.459 16.554c-4.028 6.354-7.573 13.325-10.68 20.635c-1.59 3.633-2.984 7.402-4.384 11.177c-1.303 3.823-2.623 7.656-3.748 11.581l-.859 2.937l-.807 2.961c-.565 1.966-1.024 3.969-1.517 5.961a101.81 101.81 0 0 0-.691 2.923l-.658 2.87c-.111.45-.221 1-.331 1.561l-.33 1.653l-.659 3.307l-.509 2.796c-.178 1.015-.392 2.026-.541 3.044c-.286 2.037-.707 4.062-.964 6.1c-.575 4.071-1.145 8.145-1.536 12.217c-.856 8.144-1.348 16.284-1.332 24.319c-.013 4.027.19 7.998.451 11.95c.346 3.922.767 7.827 1.445 11.612c.667 3.781 1.475 7.516 2.595 11.034c1.096 3.522 2.305 6.981 3.875 10.086c3.066 6.229 6.993 11.663 11.692 14.765c1.174.762 2.377 1.416 3.611 1.881c.675.327 1.058.332 1.516.499l.33.113l.165.057l.349.069l1.464.278l.73.139l.365.069l.182.035c.193.042-.975-.213-.426-.105l.948.04l.935.063l.94-.046c.623-.024 1.239-.02 1.865-.145c.623-.105 1.233-.112 1.858-.3c4.946-.984 9.827-3.886 14.207-7.514c2.184-1.868 4.286-3.838 6.185-6.076c1.941-2.153 3.707-4.504 5.401-6.822c3.334-4.733 6.166-9.669 8.614-14.531c.597-1.232 1.217-2.416 1.775-3.63l1.635-3.595l1.486-3.559c.487-1.166.92-2.349 1.38-3.487c1.765-4.6 3.303-8.965 4.553-13.077c1.318-4.08 2.334-7.908 3.267-11.353c.873-3.467 1.647-6.564 2.232-9.286l.44-1.958l.34-1.73l.623-2.99l1.152-6.301l-.049.266z" />
      <path d="M135.065 364.032l3.458-1.415c2.266-.888 5.567-2.263 9.808-3.88c4.428-1.544 9.82-3.526 16.03-5.583l9.81-3.074l5.324-1.644l5.599-1.58l11.923-3.293c4.131-1.066 8.414-2.112 12.82-3.189l6.699-1.629l6.89-1.504c4.649-.995 9.39-2.098 14.239-3.022c4.85-.919 9.776-1.895 14.776-2.805c2.497-.477 5.016-.909 7.551-1.316l7.637-1.26c10.227-1.707 20.667-3.05 31.104-4.428c5.226-.622 10.458-1.193 15.673-1.733l7.802-.821l7.774-.642l15.353-1.19l15.014-.759c9.853-.534 19.41-.572 28.454-.715c9.047-.098 17.617.197 25.508.349c7.896.228 15.137.751 21.542 1.119c3.204.233 6.198.368 8.969.675l7.608.775c4.591.444 8.191.901 10.644 1.176l3.76.468c7.456.928 12.748 7.725 11.82 15.181c-.809 6.495-6.07 11.348-12.341 11.878l-.391.03l-3.678.313c-2.397.174-5.911.482-10.375.737c-4.465.3-9.876.563-16.086 1.077l-9.882.683c-3.478.231-7.131.395-10.944.745l-11.889.91c-4.107.291-8.351.553-12.711.972l-13.416 1.12c-4.579.308-9.25.784-13.999 1.246l-14.469 1.297l-14.808 1.517l-7.503.73l-7.536.854l-15.15 1.663c-5.049.62-10.091 1.288-15.126 1.864c-5.039.552-10.033 1.266-14.994 1.943c-9.945 1.216-19.676 2.72-29.126 4.028l-13.877 2.124c-4.538.688-8.976 1.367-13.275 2.104l-12.56 2.051l-11.694 2.068l-5.511.958l-5.233.991l-9.686 1.791l-15.483 3.026c-4.426 1.008-7.936 1.696-10.313 2.214l-3.662.741l-.015.003c-7.369 1.491-14.55-3.274-16.041-10.643c-1.318-6.51 2.254-12.874 8.185-15.296z" />
      <path d="M59.639 449.102l4.309-1.574l5.184-1.862c2.063-.73 4.321-1.599 7.125-2.45l9.128-2.903l5.194-1.634c1.805-.562 3.615-1.05 5.519-1.606l12.087-3.467l3.235-.927l3.322-.869l6.878-1.786c4.687-1.2 9.566-2.521 14.627-3.758c5.057-1.253 10.308-2.45 15.698-3.723c5.388-1.297 10.94-2.494 16.614-3.74c5.673-1.247 11.47-2.531 17.384-3.724l18.028-3.546a751.74 751.74 0 0 1 18.515-3.409c6.241-1.08 12.523-2.224 18.848-3.27l19.056-2.967c3.182-.487 6.356-1.015 9.545-1.442l9.553-1.292c6.358-.864 12.691-1.723 18.983-2.512l18.75-2.097l9.218-1c3.055-.311 6.101-.562 9.117-.82l17.771-1.497c2.9-.251 5.785-.41 8.636-.565l8.44-.477l16.176-.891l15.183-.343c4.868-.084 9.515-.268 13.963-.255l12.646.2l11.107.197c1.71.016 3.371.149 4.95.237l4.517.272c5.718.328 10.203.673 13.259.875l4.683.349c8.314.619 14.551 7.86 13.932 16.174c-.571 7.668-6.776 13.57-14.26 13.955l-.688.034l-4.475.235c-2.917.128-7.193.364-12.624.553l-4.287.163c-1.5.063-3.063.09-4.712.239l-10.64.719l-12.086.794c-4.258.289-8.752.739-13.428 1.127l-14.591 1.265l-15.634 1.597l-8.153.839c-2.752.277-5.536.559-8.352.935l-17.243 2.044l-8.851 1.035l-8.976 1.189l-18.266 2.357l-18.547 2.63l-9.34 1.307l-9.349 1.408l-18.682 2.823c-6.21.947-12.384 1.984-18.517 2.961c-12.281 1.874-24.302 4.076-35.983 5.971l-17.156 3.023c-5.608.976-11.103 1.91-16.415 2.947c-5.324.996-10.494 2.007-15.517 2.889c-5.017.907-9.823 1.902-14.461 2.792c-9.287 1.783-17.717 3.538-25.215 5.071c-1.862.39-3.717.74-5.412 1.129l-4.932 1.084L85.319 474c-1.313.281-2.556.545-3.776.864l-3.397.815l-5.357 1.285l-4.467 1.047l-.049.011c-8.128 1.905-16.261-3.139-18.167-11.267c-1.764-7.536 2.44-15.072 9.533-17.653z" />
    </svg>
  );
}

function SortPillToggle({ value, onChange }) {
  return (
    <div className="stats-sort-pill-wrap">
      <button
        type="button"
        className={`stats-sort-pill-btn ${value === "default" ? "active" : ""}`}
        onClick={() => onChange("default")}
      >
        Default
      </button>
      <button
        type="button"
        className={`stats-sort-pill-btn ${value === "completion" ? "active" : ""}`}
        onClick={() => onChange("completion")}
      >
        Completion
      </button>
    </div>
  );
}

export default function ProfileStatsPage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user, username: currentUsername, loading: userLoading } = useUser();
  const { setLoading, isLoading } = useLoading();

  const isOwner = !routeUsername || routeUsername.toLowerCase() === currentUsername?.toLowerCase();
  const targetUsername = routeUsername || currentUsername;

  const [profileData, setProfileData] = useState(null);
  const [caughtData, setCaughtData] = useState(null);
  const [ownerPreferences, setOwnerPreferences] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [gamesPage, setGamesPage] = useState(1);
  const [methodsPage, setMethodsPage] = useState(1);

  // Hunt Stats & History states
  const [completedHunts, setCompletedHunts] = useState([]);
  const [showcaseTab, setShowcaseTab] = useState("completed"); // "completed" | "fails"
  const [huntSearch, setHuntSearch] = useState("");
  const [huntSortType, setHuntSortType] = useState("date-desc");
  const [huntPage, setHuntPage] = useState(1);
  const [showHuntSortDropdown, setShowHuntSortDropdown] = useState(false);
  const huntSortRef = useRef(null);

  // Hunt Methods & Games Sort & Pagination states
  const [huntMethodSort, setHuntMethodSort] = useState("most-hunts");
  const [showHuntMethodSort, setShowHuntMethodSort] = useState(false);
  const [huntMethodsPage, setHuntMethodsPage] = useState(1);
  const huntMethodSortRef = useRef(null);

  const [huntGameSort, setHuntGameSort] = useState("most-hunts");
  const [showHuntGameSort, setShowHuntGameSort] = useState(false);
  const [huntGamesPage, setHuntGamesPage] = useState(1);
  const huntGameSortRef = useRef(null);

  // Category Sort states
  const [genSort, setGenSort] = useState("default");
  const [specialSort, setSpecialSort] = useState("default");
  const [formSort, setFormSort] = useState("default");
  const [typeSort, setTypeSort] = useState("default");

  // Poké Ball Sort state
  const [ballSortType, setBallSortType] = useState("most-caught");
  const [showBallSortDropdown, setShowBallSortDropdown] = useState(false);
  const ballSortRef = useRef(null);

  // Marks & Ribbons Sort state
  const [markSortType, setMarkSortType] = useState("most-marked");
  const [showMarkSortDropdown, setShowMarkSortDropdown] = useState(false);
  const markSortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ballSortRef.current && !ballSortRef.current.contains(event.target)) {
        setShowBallSortDropdown(false);
      }
      if (markSortRef.current && !markSortRef.current.contains(event.target)) {
        setShowMarkSortDropdown(false);
      }
      if (huntSortRef.current && !huntSortRef.current.contains(event.target)) {
        setShowHuntSortDropdown(false);
      }
      if (huntMethodSortRef.current && !huntMethodSortRef.current.contains(event.target)) {
        setShowHuntMethodSort(false);
      }
      if (huntGameSortRef.current && !huntGameSortRef.current.contains(event.target)) {
        setShowHuntGameSort(false);
      }
    };

    if (showBallSortDropdown || showMarkSortDropdown || showHuntSortDropdown || showHuntMethodSort || showHuntGameSort) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBallSortDropdown, showMarkSortDropdown, showHuntSortDropdown, showHuntMethodSort, showHuntGameSort]);

  useEffect(() => {
    if (!targetUsername && !userLoading) {
      navigate("/trainers");
      return;
    }
    if (!targetUsername) return;

    let mounted = true;
    setDataLoading(true);
    setLoading('profile-stats-page', true);

    const fetchData = async () => {
      try {
        const prof = isOwner 
          ? await profileAPI.getProfile() 
          : await profileAPI.getPublicProfile(targetUsername);

        if (!mounted) return;

        if ((prof?.isProfilePublic === false || prof?.isStatsPublic === false) && !isOwner && !prof?.isPrivateAdminView) {
          setIsPrivate(true);
          setProfileData(prof);
          setDataLoading(false);
          setLoading('profile-stats-page', false);
          return;
        }

        let map = {};
        if (isOwner) {
          const serverMap = await caughtAPI.getCaughtData();
          map = serverMap || {};
          try {
            const raw = localStorage.getItem(`caughtInfoMap:${currentUsername}`);
            if (raw) {
              const localCache = JSON.parse(raw);
              if (localCache && typeof localCache === 'object') {
                map = { ...serverMap, ...localCache };
              }
            }
          } catch {}
        } else {
          const response = await profileAPI.getPublicCaughtData(targetUsername);
          map = response?.caughtPokemon || {};
        }

        let hunts = [];
        if (isOwner) {
          try {
            const raw = localStorage.getItem(`completedHunts:${currentUsername}`) || localStorage.getItem("completedHunts") || localStorage.getItem("huntHistory");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) hunts = parsed;
            }
            const rawFails = localStorage.getItem(`completedFails:${currentUsername}`) || localStorage.getItem("completedFails");
            if (rawFails) {
              const parsedFails = JSON.parse(rawFails);
              if (Array.isArray(parsedFails)) {
                parsedFails.forEach(f => {
                  if (!hunts.some(h => (h.entryId && (h.entryId === f.entryId || h.entryId === f.id)) || (h.id && (h.id === f.id || h.id === f.entryId)))) {
                    hunts.push({ ...f, outcome: "failed", isFail: true });
                  }
                });
              }
            }

            // Also harvest any active hunt phases and fails
            const rawActive = localStorage.getItem("activeHunts");
            if (rawActive) {
              const parsedActive = JSON.parse(rawActive);
              if (Array.isArray(parsedActive)) {
                parsedActive.forEach(ah => {
                  if (Array.isArray(ah.phases)) {
                    ah.phases.forEach(p => {
                      if (!hunts.some(h => (h.entryId && (h.entryId === p.entryId || h.entryId === p.id)) || (h.id && (h.id === p.id || h.id === p.entryId)))) {
                        hunts.push({
                          ...p,
                          pokemonName: p.pokemonName || p.pokemon?.name || ah.pokemonName || ah.pokemon?.name,
                          pokemon: p.pokemon || ah.pokemon,
                          game: p.game || ah.game,
                          method: p.method || ah.method,
                          outcome: p.outcome || "caught",
                          isFail: p.outcome === "failed" || !!p.isFail
                        });
                      }
                    });
                  }
                });
              }
            }
          } catch {}
        } else if (prof?.completedHunts && Array.isArray(prof.completedHunts)) {
          hunts = prof.completedHunts;
        }

        if (!mounted) return;

        setProfileData(prof);
        setCaughtData(map);
        setCompletedHunts(hunts);
        setOwnerPreferences(prof?.dexPreferences || null);
        setIsPrivate(false);
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      } finally {
        if (mounted) {
          setDataLoading(false);
          setLoading('profile-stats-page', false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      setLoading('profile-stats-page', false);
    };
  }, [targetUsername, isOwner, userLoading, currentUsername, setLoading, navigate]);

  const [activePreferences, setActivePreferences] = useState(() => {
    try {
      const stored = localStorage.getItem("dexPreferences");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handlePrefsChange = () => {
      try {
        const stored = localStorage.getItem("dexPreferences");
        if (stored) {
          setActivePreferences(JSON.parse(stored));
        }
      } catch {}
    };

    window.addEventListener("dexPreferencesChanged", handlePrefsChange);
    window.addEventListener("storage", handlePrefsChange);
    return () => {
      window.removeEventListener("dexPreferencesChanged", handlePrefsChange);
      window.removeEventListener("storage", handlePrefsChange);
    };
  }, []);

  const effectivePreferences = useMemo(() => {
    return activePreferences || user?.dexPreferences || ownerPreferences || null;
  }, [activePreferences, user?.dexPreferences, ownerPreferences]);

  // Compute detailed statistics
  const stats = useMemo(() => {
    if (!caughtData) return null;
    return calculateDetailedStats(caughtData, effectivePreferences);
  }, [caughtData, effectivePreferences]);

  const generations = stats?.generations;
  const specialCategories = stats?.specialCategories;
  const categories = stats?.categories;
  const types = stats?.types;

  const sortedGenerations = useMemo(() => {
    if (!generations) return [];
    if (genSort === "completion") {
      return [...generations].sort((a, b) => {
        if (b.combinedPct !== a.combinedPct) return b.combinedPct - a.combinedPct;
        const bCaught = (b.regularCaught || 0) + (b.shinyCaught || 0);
        const aCaught = (a.regularCaught || 0) + (a.shinyCaught || 0);
        if (bCaught !== aCaught) return bCaught - aCaught;
        return a.gen - b.gen;
      });
    }
    return generations;
  }, [generations, genSort]);

  const sortedSpecialCategories = useMemo(() => {
    if (!specialCategories) return [];
    if (specialSort === "completion") {
      return [...specialCategories].sort((a, b) => {
        if (b.combinedPct !== a.combinedPct) return b.combinedPct - a.combinedPct;
        const bCaught = (b.regularCaught || 0) + (b.shinyCaught || 0);
        const aCaught = (a.regularCaught || 0) + (a.shinyCaught || 0);
        return bCaught - aCaught;
      });
    }
    return specialCategories;
  }, [specialCategories, specialSort]);

  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    if (formSort === "completion") {
      return [...categories].sort((a, b) => {
        if (b.combinedPct !== a.combinedPct) return b.combinedPct - a.combinedPct;
        const bCaught = (b.regularCaught || 0) + (b.shinyCaught || 0);
        const aCaught = (a.regularCaught || 0) + (a.shinyCaught || 0);
        return bCaught - aCaught;
      });
    }
    return categories;
  }, [categories, formSort]);

  const sortedTypes = useMemo(() => {
    if (!types) return [];
    if (typeSort === "completion") {
      return [...types].sort((a, b) => {
        if (b.combinedPct !== a.combinedPct) return b.combinedPct - a.combinedPct;
        const bCaught = (b.regularCaught || 0) + (b.shinyCaught || 0);
        const aCaught = (a.regularCaught || 0) + (a.shinyCaught || 0);
        return bCaught - aCaught;
      });
    }
    return types;
  }, [types, typeSort]);

  const allGames = useMemo(() => stats?.allGames || [], [stats?.allGames]);
  const allMethods = useMemo(() => stats?.allMethods || [], [stats?.allMethods]);
  const allBalls = useMemo(() => stats?.allBalls || [], [stats?.allBalls]);
  const allMarks = useMemo(() => stats?.allMarks || [], [stats?.allMarks]);

  const totalGameHunts = useMemo(() => {
    return allGames.reduce((acc, g) => acc + (g.count || 0), 0);
  }, [allGames]);

  const totalMethodHunts = useMemo(() => {
    return allMethods.reduce((acc, m) => acc + (m.count || 0), 0);
  }, [allMethods]);

  const totalBallsCaught = useMemo(() => {
    return allBalls.reduce((acc, b) => acc + (b.count || 0), 0);
  }, [allBalls]);

  const totalBallsRegular = useMemo(() => {
    return allBalls.reduce((acc, b) => acc + (b.regular || 0), 0);
  }, [allBalls]);

  const totalBallsShiny = useMemo(() => {
    return allBalls.reduce((acc, b) => acc + (b.shiny || 0), 0);
  }, [allBalls]);

  const sortedBalls = useMemo(() => {
    if (!allBalls || allBalls.length === 0) return [];
    const list = [...allBalls];
    switch (ballSortType) {
      case "most-caught":
        return list.sort((a, b) => (b.count || 0) - (a.count || 0));
      case "least-caught":
        return list.sort((a, b) => (a.count || 0) - (b.count || 0));
      case "alpha-asc":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "alpha-desc":
        return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      case "most-shiny":
        return list.sort((a, b) => {
          if ((b.shiny || 0) !== (a.shiny || 0)) return (b.shiny || 0) - (a.shiny || 0);
          return (b.count || 0) - (a.count || 0);
        });
      case "most-regular":
        return list.sort((a, b) => {
          if ((b.regular || 0) !== (a.regular || 0)) return (b.regular || 0) - (a.regular || 0);
          return (b.count || 0) - (a.count || 0);
        });
      case "release-date":
        return list.sort((a, b) => {
          const idxA = BALL_OPTIONS.findIndex(opt => opt.value === a.name || opt.name === a.name);
          const idxB = BALL_OPTIONS.findIndex(opt => opt.value === b.name || opt.name === b.name);
          const valA = idxA === -1 ? 999 : idxA;
          const valB = idxB === -1 ? 999 : idxB;
          return valA - valB;
        });
      default:
        return list;
    }
  }, [allBalls, ballSortType]);

  const getBallSortLabel = () => {
    switch (ballSortType) {
      case "most-caught":
        return "Most Caught";
      case "least-caught":
        return "Least Caught";
      case "alpha-asc":
        return "Name (A → Z)";
      case "alpha-desc":
        return "Name (Z → A)";
      case "most-shiny":
        return "Most Shiny";
      case "most-regular":
        return "Most Regular";
      case "release-date":
        return "Release Date";
      default:
        return "Most Caught";
    }
  };

  const totalMarksCaught = useMemo(() => {
    return allMarks.reduce((acc, m) => acc + (m.count || 0), 0);
  }, [allMarks]);

  const totalMarksRegular = useMemo(() => {
    return allMarks.reduce((acc, m) => acc + (m.regular || 0), 0);
  }, [allMarks]);

  const totalMarksShiny = useMemo(() => {
    return allMarks.reduce((acc, m) => acc + (m.shiny || 0), 0);
  }, [allMarks]);

  const sortedMarks = useMemo(() => {
    if (!allMarks || allMarks.length === 0) return [];
    const list = [...allMarks];
    switch (markSortType) {
      case "most-marked":
        return list.sort((a, b) => (b.count || 0) - (a.count || 0));
      case "least-marked":
        return list.sort((a, b) => (a.count || 0) - (b.count || 0));
      case "alpha-asc":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "alpha-desc":
        return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      case "most-shiny":
        return list.sort((a, b) => {
          if ((b.shiny || 0) !== (a.shiny || 0)) return (b.shiny || 0) - (a.shiny || 0);
          return (b.count || 0) - (a.count || 0);
        });
      case "most-regular":
        return list.sort((a, b) => {
          if ((b.regular || 0) !== (a.regular || 0)) return (b.regular || 0) - (a.regular || 0);
          return (b.count || 0) - (a.count || 0);
        });
      case "release-date":
        return list.sort((a, b) => {
          const idxA = MARK_OPTIONS.findIndex(opt => opt.value === a.name || opt.name === a.name);
          const idxB = MARK_OPTIONS.findIndex(opt => opt.value === b.name || opt.name === b.name);
          const valA = idxA === -1 ? 999 : idxA;
          const valB = idxB === -1 ? 999 : idxB;
          return valA - valB;
        });
      default:
        return list;
    }
  }, [allMarks, markSortType]);

  const getMarkSortLabel = () => {
    switch (markSortType) {
      case "most-marked":
        return "Most Marked";
      case "least-marked":
        return "Least Marked";
      case "alpha-asc":
        return "Name (A → Z)";
      case "alpha-desc":
        return "Name (Z → A)";
      case "most-shiny":
        return "Most Shiny";
      case "most-regular":
        return "Most Regular";
      case "release-date":
        return "Release Date";
      default:
        return "Most Marked";
    }
  };

  const huntStats = useMemo(() => {
    return calculateHuntStats(completedHunts, caughtData);
  }, [completedHunts, caughtData]);

  const currentSourceList = useMemo(() => {
    if (!huntStats) return [];
    return showcaseTab === "fails" ? (huntStats.failsList || []) : (huntStats.huntsList || []);
  }, [huntStats, showcaseTab]);

  const filteredHuntsList = useMemo(() => {
    if (!currentSourceList) return [];
    let list = [...currentSourceList];
    const rawSearch = typeof huntSearch === "string" ? huntSearch : (huntSearch?.target?.value ?? "");
    const q = rawSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(h => 
        (h.pokemonName && h.pokemonName.toLowerCase().includes(q)) ||
        (h.nickname && h.nickname.toLowerCase().includes(q)) ||
        (h.game && h.game.toLowerCase().includes(q)) ||
        (h.method && h.method.toLowerCase().includes(q)) ||
        (h.reason && h.reason.toLowerCase().includes(q)) ||
        (h.notes && h.notes.toLowerCase().includes(q))
      );
    }
    switch (huntSortType) {
      case "date-desc":
        return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      case "date-asc":
        return list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      case "checks-desc":
        return list.sort((a, b) => (Number(b.totalChecks || b.checks) || 0) - (Number(a.totalChecks || a.checks) || 0));
      case "checks-asc":
        return list.sort((a, b) => (Number(a.totalChecks || a.checks) || 0) - (Number(b.totalChecks || b.checks) || 0));
      case "time-desc":
        return list.sort((a, b) => (Number(b.elapsedMs || b.time) || 0) - (Number(a.elapsedMs || a.time) || 0));
      case "time-asc":
        return list.sort((a, b) => (Number(a.elapsedMs || a.time) || 0) - (Number(b.elapsedMs || b.time) || 0));
      case "phases-desc":
        return list.sort((a, b) => (Number(b.phaseCount || (b.phases?.length ? b.phases.length + 1 : 1)) || 1) - (Number(a.phaseCount || (a.phases?.length ? a.phases.length + 1 : 1)) || 1));
      default:
        return list;
    }
  }, [currentSourceList, huntSearch, huntSortType]);

  const HUNTS_PER_PAGE = 6;
  const totalHuntPages = Math.ceil(filteredHuntsList.length / HUNTS_PER_PAGE) || 1;
  const paginatedHunts = filteredHuntsList.slice((huntPage - 1) * HUNTS_PER_PAGE, huntPage * HUNTS_PER_PAGE);

  const currentTotalChecks = useMemo(() => {
    return currentSourceList.reduce((acc, h) => acc + (Number(h.totalChecks || h.checks) || 0), 0);
  }, [currentSourceList]);

  const currentTotalTime = useMemo(() => {
    return currentSourceList.reduce((acc, h) => acc + (Number(h.elapsedMs || h.time) || 0), 0);
  }, [currentSourceList]);

  const getOddsEvaluation = (checks, odds) => {
    if (!checks || !odds || odds <= 0) return null;
    const ratio = (checks / odds) * 100;
    const formattedPct = ratio < 10 ? ratio.toFixed(1) : Math.round(ratio).toLocaleString();
    
    if (ratio <= 25) {
      return {
        pctText: `${formattedPct}% of odds`,
        comment: "Extremely lucky!",
        type: "super-lucky"
      };
    }
    if (ratio <= 75) {
      return {
        pctText: `${formattedPct}% of odds`,
        comment: "Lucky!",
        type: "lucky"
      };
    }
    if (ratio <= 100) {
      return {
        pctText: `${formattedPct}% of odds`,
        comment: "Below odds! Nice hunt.",
        type: "good"
      };
    }
    if (ratio <= 150) {
      return {
        pctText: `${formattedPct}% of odds`,
        comment: "Slightly over odds",
        type: "slight-over"
      };
    }
    if (ratio <= 300) {
      return {
        pctText: `${formattedPct}% of odds`,
        comment: "Over odds... hang in there!",
        type: "over"
      };
    }
    return {
      pctText: `${ratio.toLocaleString(undefined, { maximumFractionDigits: 0 })}% of odds`,
      comment: "Brutal... way over odds",
      type: "brutal"
    };
  };

  const getHuntSortLabel = (type = huntSortType) => {
    switch (type) {
      case "date-desc": return "Date (Newest)";
      case "date-asc": return "Date (Oldest)";
      case "checks-desc": return "Most Checks";
      case "checks-asc": return "Fewest Checks";
      case "time-desc": return "Longest Time";
      case "time-asc": return "Shortest Time";
      case "phases-desc": return "Most Phases";
      default: return "Date (Newest)";
    }
  };

  // Sorted & Paginated Hunting Methods
  const sortedHuntMethods = useMemo(() => {
    if (!huntStats?.methodBreakdown) return [];
    const list = [...huntStats.methodBreakdown];
    switch (huntMethodSort) {
      case "most-hunts":
        return list.sort((a, b) => b.count - a.count || b.totalChecks - a.totalChecks);
      case "least-hunts":
        return list.sort((a, b) => a.count - b.count || a.totalChecks - b.totalChecks);
      case "most-checks":
        return list.sort((a, b) => b.totalChecks - a.totalChecks);
      case "least-checks":
        return list.sort((a, b) => a.totalChecks - b.totalChecks);
      case "highest-avg":
        return list.sort((a, b) => b.avgChecks - a.avgChecks);
      case "lowest-avg":
        return list.sort((a, b) => a.avgChecks - b.avgChecks);
      case "alpha-asc":
        return list.sort((a, b) => a.method.localeCompare(b.method));
      case "alpha-desc":
        return list.sort((a, b) => b.method.localeCompare(a.method));
      default:
        return list;
    }
  }, [huntStats?.methodBreakdown, huntMethodSort]);

  const METHODS_PER_PAGE = 5;
  const totalHuntMethodPages = Math.ceil(sortedHuntMethods.length / METHODS_PER_PAGE) || 1;
  const paginatedHuntMethods = sortedHuntMethods.slice((huntMethodsPage - 1) * METHODS_PER_PAGE, huntMethodsPage * METHODS_PER_PAGE);

  const getHuntMethodSortLabel = (type = huntMethodSort) => {
    switch (type) {
      case "most-hunts": return "Most Hunts";
      case "least-hunts": return "Least Hunts";
      case "most-checks": return "Most Checks";
      case "least-checks": return "Fewest Checks";
      case "highest-avg": return "Highest Avg Checks";
      case "lowest-avg": return "Lowest Avg Checks";
      case "alpha-asc": return "Name (A → Z)";
      case "alpha-desc": return "Name (Z → A)";
      default: return "Most Hunts";
    }
  };

  // Sorted & Paginated Hunting Games
  const sortedHuntGames = useMemo(() => {
    if (!huntStats?.gameBreakdown) return [];
    const list = [...huntStats.gameBreakdown];
    switch (huntGameSort) {
      case "most-hunts":
        return list.sort((a, b) => b.count - a.count || b.totalChecks - a.totalChecks);
      case "least-hunts":
        return list.sort((a, b) => a.count - b.count || a.totalChecks - b.totalChecks);
      case "most-checks":
        return list.sort((a, b) => b.totalChecks - a.totalChecks);
      case "least-checks":
        return list.sort((a, b) => a.totalChecks - b.totalChecks);
      case "highest-avg":
        return list.sort((a, b) => b.avgChecks - a.avgChecks);
      case "lowest-avg":
        return list.sort((a, b) => a.avgChecks - b.avgChecks);
      case "alpha-asc":
        return list.sort((a, b) => a.game.localeCompare(b.game));
      case "alpha-desc":
        return list.sort((a, b) => b.game.localeCompare(a.game));
      default:
        return list;
    }
  }, [huntStats?.gameBreakdown, huntGameSort]);

  const GAMES_PER_PAGE = 5;
  const totalHuntGamePages = Math.ceil(sortedHuntGames.length / GAMES_PER_PAGE) || 1;
  const paginatedHuntGames = sortedHuntGames.slice((huntGamesPage - 1) * GAMES_PER_PAGE, huntGamesPage * GAMES_PER_PAGE);

  const getHuntGameSortLabel = (type = huntGameSort) => {
    switch (type) {
      case "most-hunts": return "Most Hunts";
      case "least-hunts": return "Least Hunts";
      case "most-checks": return "Most Checks";
      case "least-checks": return "Fewest Checks";
      case "highest-avg": return "Highest Avg Checks";
      case "lowest-avg": return "Lowest Avg Checks";
      case "alpha-asc": return "Name (A → Z)";
      case "alpha-desc": return "Name (Z → A)";
      default: return "Most Hunts";
    }
  };

  function formatElapsed(ms) {
    if (!ms || ms <= 0) return "0s";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  function resolveHuntPokemon(hunt) {
    if (!hunt) return null;
    if (hunt.pokemon && (hunt.pokemon.sprites || hunt.pokemon.id)) {
      return hunt.pokemon;
    }
    const rawName = (hunt.pokemonName || hunt.pokemon?.name || "").toLowerCase().trim();
    if (!rawName) return null;

    // 1. Exact match in pokemonData or formsData
    let found = pokemonData.find(p => p.name?.toLowerCase() === rawName || p.cleanName?.toLowerCase() === rawName);
    if (found) return found;

    if (formsData && Array.isArray(formsData)) {
      found = formsData.find(p => p.name?.toLowerCase() === rawName || p.cleanName?.toLowerCase() === rawName);
      if (found) return found;
    }

    // 2. Prefix match (e.g. "zygarde" -> "zygarde-50", "deoxys" -> "deoxys-normal")
    found = pokemonData.find(p => p.name?.toLowerCase().startsWith(rawName + "-"));
    if (found) return found;

    if (formsData && Array.isArray(formsData)) {
      found = formsData.find(p => p.name?.toLowerCase().startsWith(rawName + "-"));
      if (found) return found;
    }

    // 3. ID lookup if id is present
    const id = Number(hunt.pokemon?.id || hunt.pokemonId);
    if (!isNaN(id) && id > 0 && id < 2000) {
      found = pokemonData.find(p => p.id === id);
      if (found) return found;
    }

    return null;
  }

  function getHuntSprite(hunt, useHome) {
    if (!hunt) return "";
    const mon = resolveHuntPokemon(hunt);
    if (mon) {
      return getSpriteUrl(mon, true, useHome);
    }
    if (hunt.pokemon) {
      return getSpriteUrl(hunt.pokemon, true, useHome);
    }
    return "";
  }

  const pageRef = useRef(null);

  useEffect(() => {
    if (dataLoading || userLoading || !stats || isPrivate) return;

    let ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      // Smooth section-level scroll reveals with full style cleanup
      const sections = gsap.utils.toArray(".stats-hero-card, .stats-overview-grid, .stats-section-block");

      sections.forEach((sec) => {
        gsap.fromTo(
          sec,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: "power2.out",
            clearProps: "all",
            scrollTrigger: {
              trigger: sec,
              start: "top 92%",
              once: true,
            }
          }
        );
      });
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, [dataLoading, userLoading, stats, isPrivate]);

  if (dataLoading || userLoading) {
    return <SectionLoader minHeight="60vh" message="Calculating collection analytics..." />;
  }

  // Privacy locked screen
  if (isPrivate) {
    return (
      <div className="stats-page-container">
        <div className="stats-private-card">
          <Lock className="stats-private-icon" />
          <h2>This Profile is Private</h2>
          <p>{targetUsername}'s collection statistics are hidden by their privacy settings.</p>
          <Button
            as={Link}
            to="/trainers"
            variant="secondary"
            size="sm"
            className="stats-back-btn"
            icon={<ArrowLeft size={16} />}
          >
            Back to Trainers
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-page-container">
        <div className="stats-empty-box">
          <p>No statistics available for this trainer.</p>
          <Button
            as={Link}
            to={isOwner ? "/profile" : `/u/${targetUsername}`}
            variant="secondary"
            size="sm"
            className="stats-back-btn"
            icon={<ArrowLeft size={16} />}
          >
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  const { overview, topHighlights, heroSprites, genderStats } = stats;

  const ITEMS_PER_PAGE = 10;
  const totalGamesPages = Math.ceil(allGames.length / ITEMS_PER_PAGE) || 1;
  const paginatedGames = allGames.slice((gamesPage - 1) * ITEMS_PER_PAGE, gamesPage * ITEMS_PER_PAGE);

  const totalMethodsPages = Math.ceil(allMethods.length / ITEMS_PER_PAGE) || 1;
  const paginatedMethods = allMethods.slice((methodsPage - 1) * ITEMS_PER_PAGE, methodsPage * ITEMS_PER_PAGE);

  const profileLink = isOwner ? "/profile" : `/u/${targetUsername}`;
  const avatarUserObj = isOwner ? user : profileData;
  const avatarUrl = getUserAvatarUrl(avatarUserObj);
  const isCustomAvatar = Boolean(avatarUserObj?.avatar);
  const useHomeSprites = Boolean(effectivePreferences?.useHomeSprites);

  return (
    <div ref={pageRef} className={`stats-page-container fade-in-content ${useHomeSprites ? "mode-home-sprites" : "mode-pixel-sprites"}`}>
      {/* Hero Trainer Banner */}
      <div className="stats-hero-card">
        <div className="stats-hero-profile">
          <div className="stats-hero-avatar-wrap">
            <img 
              src={avatarUrl} 
              alt={targetUsername} 
              className="stats-hero-avatar"
              onError={(e) => { e.currentTarget.src = "/avatar.png"; }}
            />
          </div>
          <div className="stats-hero-info">
            <h1>
              {targetUsername} Statistics
            </h1>
            <p className="stats-hero-subtitle">
              Collection analytics & hunt history
            </p>
          </div>
        </div>

        {/* Master Completion Center Display */}
        <div className="stats-hero-master-box">
          <img 
            src={heroSprites?.mewtwo || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/150.png"} 
            alt="Mewtwo" 
            className={`stats-hero-legend-sprite stats-hero-legend-left ${useHomeSprites ? "home-sprite" : "pixel-sprite"}`}
          />
          <div className="stats-hero-master-center">
            <div className="stats-hero-master-title">
              <Mastery100Icon size={14} color="var(--accent)" />
              <span>MASTER COMPLETION</span>
            </div>
            <div className="stats-hero-master-pct">
              {overview.overallCombinedPct}%
            </div>
            <div className="stats-hero-master-sub">
              {overview.totalCombinedCaught.toLocaleString()} / {overview.totalCombinedPossible.toLocaleString()} Pokémon collected
            </div>
            <div className="stats-hero-master-bar">
              <div 
                className="stats-hero-master-fill" 
                style={{ width: `${overview.overallCombinedPct}%` }} 
              />
            </div>
          </div>
          <img 
            src={heroSprites?.rayquaza || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/384.png"} 
            alt="Rayquaza" 
            className={`stats-hero-legend-sprite stats-hero-legend-right ${useHomeSprites ? "home-sprite" : "pixel-sprite"}`}
          />
        </div>

        <div className="stats-hero-right">
          <Button
            as={Link}
            to={profileLink}
            variant="secondary"
            size="sm"
            className="stats-back-btn"
            icon={<ArrowLeft size={15} />}
          >
            Back to Profile
          </Button>
        </div>
      </div>

      {/* 5 Key Overview Metric Cards */}
      <div className="stats-overview-grid">
        {/* Regular Living Dex */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <span className="stat-overview-title">REGULAR LIVING DEX</span>
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="stat-overview-value">
                {overview.totalRegularCaught.toLocaleString()} <span className="stat-overview-denom">/ {overview.totalTrackableRegular.toLocaleString()}</span>
              </div>
              <div className="stat-overview-subtext">
                {overview.overallRegularPct}% Complete
              </div>
            </div>
            <div className="stat-overview-right">
              <ProgressRing percentage={overview.overallRegularPct} size={54} strokeWidth={5} color="var(--accent)" />
            </div>
          </div>
        </div>

        {/* Shiny Living Dex */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <span className="stat-overview-title">SHINY LIVING DEX</span>
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="stat-overview-value">
                {overview.totalShinyCaught.toLocaleString()} <span className="stat-overview-denom">/ {overview.totalTrackableShiny.toLocaleString()}</span>
              </div>
              <div className="stat-overview-subtext">
                {overview.overallShinyPct}% Complete
              </div>
            </div>
            <div className="stat-overview-right">
              <ProgressRing percentage={overview.overallShinyPct} size={54} strokeWidth={5} color="var(--accent)" />
            </div>
          </div>
        </div>

        {/* Top Game Hunted */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <span className="stat-overview-title">TOP GAME HUNTED</span>
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <span className="stat-overview-tiny-label">Pokémon</span>
              <div className="stat-overview-title-big">
                {topHighlights.topGame ? topHighlights.topGame.name : "None"}
              </div>
              <div className="stat-overview-subtext">
                {topHighlights.topGame ? `${topHighlights.topGame.count} catches recorded` : "No hunts logged"}
              </div>
            </div>
            <div className="stat-overview-right">
              {topHighlights.topGame?.image ? (
                <img src={topHighlights.topGame.image} alt="" className="stat-overview-big-img" />
              ) : (
                <Gamepad2 size={36} color="var(--profile-labels)" />
              )}
            </div>
          </div>
        </div>

        {/* Favorite Ball */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <span className="stat-overview-title">FAVORITE BALL</span>
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="stat-overview-title-big">
                {topHighlights.topBall ? topHighlights.topBall.name : "None"}
              </div>
              <div className="stat-overview-subtext">
                {topHighlights.topBall ? `${topHighlights.topBall.count} caught` : "No balls logged"}
              </div>
            </div>
            <div className="stat-overview-right">
              {topHighlights.topBall?.image ? (
                <img src={topHighlights.topBall.image} alt="" className="stat-overview-big-img" />
              ) : (
                <PokeballIcon size={36} color="var(--profile-labels)" />
              )}
            </div>
          </div>
        </div>

        {/* Top Mark */}
        <div className="stat-overview-card">
          <div className="stat-overview-header">
            <span className="stat-overview-title">TOP MARK</span>
          </div>
          <div className="stat-overview-body">
            <div className="stat-overview-left">
              <div className="stat-overview-title-big">
                {topHighlights.topMark ? topHighlights.topMark.name : "None"}
              </div>
              <div className="stat-overview-subtext">
                {topHighlights.topMark ? `${topHighlights.topMark.count} Marked` : "No marks logged"}
              </div>
            </div>
            <div className="stat-overview-right">
              {topHighlights.topMark?.image ? (
                <img src={topHighlights.topMark.image} alt="" className="stat-overview-big-img" />
              ) : (
                <Award size={36} color="var(--profile-labels)" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: Counters & Shiny Hunting Analytics */}
      {huntStats && (
        <div className="stats-section-block hunt-stats-section">
          <div className="stats-section-title">
            <div className="stats-section-title-left">
              <span>Counters & Shiny Hunting Analytics</span>
            </div>
            <div className="stats-section-title-right">
              <span className="hunt-stats-badge">{huntStats.totalHunts} Completed {huntStats.totalHunts === 1 ? "Hunt" : "Hunts"}</span>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="hunt-kpi-grid">
            {/* Captures & Success Rate */}
            <div className="hunt-kpi-card hunt-kpi-success">
              <div className="hunt-kpi-icon"><Trophy size={18} /></div>
              <div className="hunt-kpi-info">
                <div className="hunt-kpi-val-row">
                  <span className="hunt-kpi-value">{huntStats.totalHunts}</span>
                  <span className="hunt-kpi-rate-badge success">{huntStats.successRate}% Success</span>
                </div>
                <span className="hunt-kpi-label">Captures</span>
              </div>
            </div>

            {/* Failed & Fail Rate */}
            <div className="hunt-kpi-card failure-kpi">
              <div className="hunt-kpi-icon"><XCircle size={18} /></div>
              <div className="hunt-kpi-info">
                <div className="hunt-kpi-val-row">
                  <span className="hunt-kpi-value">{huntStats.totalFails}</span>
                  <span className="hunt-kpi-rate-badge failure">{huntStats.failRate}% Failed</span>
                </div>
                <span className="hunt-kpi-label">Total Fails</span>
              </div>
            </div>

            {/* Total Checks */}
            <div className="hunt-kpi-card">
              <div className="hunt-kpi-icon"><Crosshair size={18} /></div>
              <div className="hunt-kpi-info">
                <span className="hunt-kpi-value">{huntStats.totalChecks.toLocaleString()}</span>
                <span className="hunt-kpi-label">Total Checks</span>
              </div>
            </div>

            {/* Total Time Hunted */}
            <div className="hunt-kpi-card">
              <div className="hunt-kpi-icon"><Clock size={18} /></div>
              <div className="hunt-kpi-info">
                <span className="hunt-kpi-value">{formatElapsed(huntStats.totalTimeMs)}</span>
                <span className="hunt-kpi-label">Total Time Hunted</span>
              </div>
            </div>

            {/* Avg Checks */}
            <div className="hunt-kpi-card">
              <div className="hunt-kpi-icon"><TrendingUp size={18} /></div>
              <div className="hunt-kpi-info">
                <span className="hunt-kpi-value">{huntStats.avgChecks.toLocaleString()}</span>
                <span className="hunt-kpi-label">Avg Checks</span>
              </div>
            </div>

            {/* Avg Time */}
            <div className="hunt-kpi-card">
              <div className="hunt-kpi-icon"><Timer size={18} /></div>
              <div className="hunt-kpi-info">
                <span className="hunt-kpi-value">{formatElapsed(huntStats.avgTimeMs)}</span>
                <span className="hunt-kpi-label">Avg Time</span>
              </div>
            </div>
          </div>

          {/* Trophy Hall of Records */}
          <div className="hunt-records-header">
            <h3>Hall of Records & Highlights</h3>
          </div>
          <div className="hunt-records-grid">
            {/* Fastest Hunt (Fewest Checks) */}
            {huntStats.records.fastestChecks && (() => {
              const sprite = getHuntSprite(huntStats.records.fastestChecks, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-gold">
                  <div className="hunt-record-badge">
                    <CheckCheck size={13} /> Fewest Checks
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.fastestChecks.pokemonName || huntStats.records.fastestChecks.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{(huntStats.records.fastestChecks.totalChecks || huntStats.records.fastestChecks.checks).toLocaleString()}</strong> checks
                      </div>
                      <div className="hunt-record-sub">
                        <span>{huntStats.records.fastestChecks.game || "Unknown Game"}</span> • <span>{huntStats.records.fastestChecks.method || "Encounter"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Longest Hunt (Most Checks) */}
            {huntStats.records.longestChecks && (() => {
              const sprite = getHuntSprite(huntStats.records.longestChecks, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-bronze">
                  <div className="hunt-record-badge">
                    <CheckCheck size={13} /> Most Checks
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.longestChecks.pokemonName || huntStats.records.longestChecks.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{(huntStats.records.longestChecks.totalChecks || huntStats.records.longestChecks.checks).toLocaleString()}</strong> checks
                      </div>
                      <div className="hunt-record-sub">
                        <span>{huntStats.records.longestChecks.game || "Unknown Game"}</span> • <span>{huntStats.records.longestChecks.method || "Encounter"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Fastest Elapsed Time */}
            {huntStats.records.fastestTime && (() => {
              const sprite = getHuntSprite(huntStats.records.fastestTime, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-silver">
                  <div className="hunt-record-badge">
                    <Timer size={13} /> Fastest Time
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.fastestTime.pokemonName || huntStats.records.fastestTime.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{formatElapsed(huntStats.records.fastestTime.elapsedMs || huntStats.records.fastestTime.time)}</strong>
                      </div>
                      <div className="hunt-record-sub">
                        <span>{(huntStats.records.fastestTime.totalChecks || huntStats.records.fastestTime.checks).toLocaleString()} checks</span> • <span>{huntStats.records.fastestTime.game || "Game"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Longest Elapsed Time */}
            {huntStats.records.longestTime && (() => {
              const sprite = getHuntSprite(huntStats.records.longestTime, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-marathon">
                  <div className="hunt-record-badge">
                    <Timer size={13} /> Longest Hunt Time
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.longestTime.pokemonName || huntStats.records.longestTime.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{formatElapsed(huntStats.records.longestTime.elapsedMs || huntStats.records.longestTime.time)}</strong>
                      </div>
                      <div className="hunt-record-sub">
                        <span>{(huntStats.records.longestTime.totalChecks || huntStats.records.longestTime.checks).toLocaleString()} checks</span> • <span>{huntStats.records.longestTime.game || "Game"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Most Phases */}
            {huntStats.records.mostPhases && (() => {
              const sprite = getHuntSprite(huntStats.records.mostPhases, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-phases">
                  <div className="hunt-record-badge">
                    <Layers size={13} /> Most Phases
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.mostPhases.pokemonName || huntStats.records.mostPhases.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{huntStats.records.mostPhases.phaseCount || (huntStats.records.mostPhases.phases?.length ? huntStats.records.mostPhases.phases.length + 1 : 1)}</strong> Phases
                      </div>
                      <div className="hunt-record-sub">
                        <span>{(huntStats.records.mostPhases.totalChecks || huntStats.records.mostPhases.checks).toLocaleString()} total checks</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Luckiest Hunt */}
            {huntStats.records.luckiest && (() => {
              const sprite = getHuntSprite(huntStats.records.luckiest, useHomeSprites);
              return (
                <div className="hunt-record-card trophy-lucky">
                  <div className="hunt-record-badge">
                    <Clover size={13} /> Luckiest Hunt
                  </div>
                  <div className="hunt-record-content">
                    {sprite ? (
                      <img 
                        src={sprite} 
                        alt="" 
                        className={`hunt-record-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                        style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : null}
                    <div className="hunt-record-details">
                      <span className="hunt-record-name">{formatPokemonName(huntStats.records.luckiest.pokemonName || huntStats.records.luckiest.pokemon?.name)}</span>
                      <div className="hunt-record-main-stat">
                        <strong>{huntStats.records.luckiest.pctOfOdds}%</strong> of Odds
                      </div>
                      <div className="hunt-record-sub">
                        <span>{(huntStats.records.luckiest.totalChecks || huntStats.records.luckiest.checks).toLocaleString()} / {huntStats.records.luckiest.odds?.toLocaleString()} base odds</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Methods & Games Breakdown side-by-side */}
          {(huntStats.methodBreakdown.length > 0 || huntStats.gameBreakdown.length > 0) && (
            <div className="hunt-breakdown-row">
              {huntStats.methodBreakdown.length > 0 && (
                <div className="hunt-breakdown-col">
                  <div className="hunt-breakdown-col-header">
                    <h4>Top Hunting Methods</h4>
                    <div className={`stats-sort-button-wrap ${showHuntMethodSort ? 'open' : ''}`} ref={huntMethodSortRef}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="stats-sort-button"
                        onClick={() => setShowHuntMethodSort(!showHuntMethodSort)}
                        aria-label="Sort Methods"
                        icon={<ArrowUpDown size={13} />}
                      >
                        <span>{getHuntMethodSortLabel()}</span>
                      </Button>

                      {showHuntMethodSort && (
                        <div className="stats-sort-dropdown">
                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Trophy size={12} />
                              <span>Hunts</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "most-hunts" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("most-hunts");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Most Hunts
                            </button>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "least-hunts" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("least-hunts");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Least Hunts
                            </button>
                          </div>

                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Crosshair size={12} />
                              <span>Checks</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "most-checks" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("most-checks");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Most Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "least-checks" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("least-checks");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Fewest Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "highest-avg" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("highest-avg");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Highest Avg Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "lowest-avg" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("lowest-avg");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Lowest Avg Checks
                            </button>
                          </div>

                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Search size={12} />
                              <span>Name</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "alpha-asc" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("alpha-asc");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Name (A → Z)
                            </button>
                            <button
                              className={`stats-sort-option ${huntMethodSort === "alpha-desc" ? "active" : ""}`}
                              onClick={() => {
                                setHuntMethodSort("alpha-desc");
                                setHuntMethodsPage(1);
                                setShowHuntMethodSort(false);
                              }}
                            >
                              Name (Z → A)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hunt-breakdown-list">
                    {paginatedHuntMethods.map(m => (
                      <div key={m.method} className="hunt-breakdown-item">
                        <div className="hunt-breakdown-item-left">
                          <span className="hunt-breakdown-name">{m.method}</span>
                          <span className="hunt-breakdown-sub">{m.count} {m.count === 1 ? 'hunt' : 'hunts'} • avg {m.avgChecks.toLocaleString()} checks</span>
                        </div>
                        <div className="hunt-breakdown-item-right">
                          <span className="hunt-breakdown-total">{m.totalChecks.toLocaleString()} checks</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalHuntMethodPages > 1 && (
                    <div className="hunt-breakdown-pagination">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHuntMethodsPage(p => Math.max(p - 1, 1))}
                        disabled={huntMethodsPage === 1}
                        aria-label="Previous Methods Page"
                        icon={<ChevronLeft size={14} />}
                      />
                      <span className="hunt-breakdown-page-text">
                        Page {huntMethodsPage} of {totalHuntMethodPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHuntMethodsPage(p => Math.min(p + 1, totalHuntMethodPages))}
                        disabled={huntMethodsPage === totalHuntMethodPages}
                        aria-label="Next Methods Page"
                        icon={<ChevronRight size={14} />}
                      />
                    </div>
                  )}
                </div>
              )}

              {huntStats.gameBreakdown.length > 0 && (
                <div className="hunt-breakdown-col">
                  <div className="hunt-breakdown-col-header">
                    <h4>Top Hunting Games</h4>
                    <div className={`stats-sort-button-wrap ${showHuntGameSort ? 'open' : ''}`} ref={huntGameSortRef}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="stats-sort-button"
                        onClick={() => setShowHuntGameSort(!showHuntGameSort)}
                        aria-label="Sort Games"
                        icon={<ArrowUpDown size={13} />}
                      >
                        <span>{getHuntGameSortLabel()}</span>
                      </Button>

                      {showHuntGameSort && (
                        <div className="stats-sort-dropdown">
                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Trophy size={12} />
                              <span>Hunts</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntGameSort === "most-hunts" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("most-hunts");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Most Hunts
                            </button>
                            <button
                              className={`stats-sort-option ${huntGameSort === "least-hunts" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("least-hunts");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Least Hunts
                            </button>
                          </div>

                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Crosshair size={12} />
                              <span>Checks</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntGameSort === "most-checks" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("most-checks");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Most Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntGameSort === "least-checks" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("least-checks");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Fewest Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntGameSort === "highest-avg" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("highest-avg");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Highest Avg Checks
                            </button>
                            <button
                              className={`stats-sort-option ${huntGameSort === "lowest-avg" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("lowest-avg");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Lowest Avg Checks
                            </button>
                          </div>

                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Gamepad2 size={12} />
                              <span>Name</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntGameSort === "alpha-asc" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("alpha-asc");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Name (A → Z)
                            </button>
                            <button
                              className={`stats-sort-option ${huntGameSort === "alpha-desc" ? "active" : ""}`}
                              onClick={() => {
                                setHuntGameSort("alpha-desc");
                                setHuntGamesPage(1);
                                setShowHuntGameSort(false);
                              }}
                            >
                              Name (Z → A)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hunt-breakdown-list">
                    {paginatedHuntGames.map(g => (
                      <div key={g.game} className="hunt-breakdown-item">
                        <div className="hunt-breakdown-item-left">
                          <span className="hunt-breakdown-name">{g.game}</span>
                          <span className="hunt-breakdown-sub">{g.count} {g.count === 1 ? 'hunt' : 'hunts'} • avg {g.avgChecks.toLocaleString()} checks</span>
                        </div>
                        <div className="hunt-breakdown-item-right">
                          <span className="hunt-breakdown-total">{g.totalChecks.toLocaleString()} checks</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalHuntGamePages > 1 && (
                    <div className="hunt-breakdown-pagination">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHuntGamesPage(p => Math.max(p - 1, 1))}
                        disabled={huntGamesPage === 1}
                        aria-label="Previous Games Page"
                        icon={<ChevronLeft size={14} />}
                      />
                      <span className="hunt-breakdown-page-text">
                        Page {huntGamesPage} of {totalHuntGamePages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setHuntGamesPage(p => Math.min(p + 1, totalHuntGamePages))}
                        disabled={huntGamesPage === totalHuntGamePages}
                        aria-label="Next Games Page"
                        icon={<ChevronRight size={14} />}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Interactive Completed Hunts & Fails Showcase */}
          {(huntStats.totalHunts > 0 || huntStats.totalFails > 0) && (
            <div className="hunt-log-section">
              <div className="hunt-log-header">
                <div className="hunt-log-header-left">
                  <div className="hunt-tab-toggle-group">
                    <button
                      type="button"
                      className={`hunt-tab-btn ${showcaseTab === "completed" ? "active" : ""}`}
                      onClick={() => { setShowcaseTab("completed"); setHuntPage(1); }}
                    >
                      <Trophy size={15} />
                      <span>Completed Hunts</span>
                      <span className="hunt-tab-count">{huntStats.totalHunts}</span>
                    </button>
                    <button
                      type="button"
                      className={`hunt-tab-btn ${showcaseTab === "fails" ? "active" : ""}`}
                      onClick={() => { setShowcaseTab("fails"); setHuntPage(1); }}
                    >
                      <XCircle size={15} />
                      <span>Logged Fails</span>
                      <span className={`hunt-tab-count ${huntStats.totalFails > 0 ? "has-fails" : ""}`}>{huntStats.totalFails}</span>
                    </button>
                  </div>
                </div>
                <div className="hunt-log-controls">
                  <div className="hunt-search-wrap">
                    <SearchField
                      id="hunt-showcase-search"
                      placeholder={showcaseTab === "fails" ? "Search fails..." : "Search Pokémon, game, method..."}
                      value={typeof huntSearch === "string" ? huntSearch : ""}
                      onChange={(e) => {
                        const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                        setHuntSearch(val);
                        setHuntPage(1);
                      }}
                      onClear={() => { setHuntSearch(""); setHuntPage(1); }}
                      size="md"
                    />
                  </div>

                  <div className={`stats-sort-button-wrap ${showHuntSortDropdown ? 'open' : ''}`} ref={huntSortRef}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="stats-sort-button"
                      onClick={() => setShowHuntSortDropdown(!showHuntSortDropdown)}
                      aria-label="Sort Hunts"
                      icon={<ArrowUpDown size={15} />}
                    >
                      <span>{getHuntSortLabel()}</span>
                    </Button>

                    {showHuntSortDropdown && (
                      <div className="stats-sort-dropdown">
                        <div className="stats-sort-section">
                          <div className="stats-sort-section-title">
                            <Calendar size={12} />
                            <span>Date</span>
                          </div>
                          <button
                            className={`stats-sort-option ${huntSortType === "date-desc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("date-desc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Date (Newest)
                          </button>
                          <button
                            className={`stats-sort-option ${huntSortType === "date-asc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("date-asc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Date (Oldest)
                          </button>
                        </div>

                        <div className="stats-sort-section">
                          <div className="stats-sort-section-title">
                            <Crosshair size={12} />
                            <span>Checks</span>
                          </div>
                          <button
                            className={`stats-sort-option ${huntSortType === "checks-desc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("checks-desc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Most Checks
                          </button>
                          <button
                            className={`stats-sort-option ${huntSortType === "checks-asc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("checks-asc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Fewest Checks
                          </button>
                        </div>

                        <div className="stats-sort-section">
                          <div className="stats-sort-section-title">
                            <Clock size={12} />
                            <span>Time</span>
                          </div>
                          <button
                            className={`stats-sort-option ${huntSortType === "time-desc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("time-desc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Longest Time
                          </button>
                          <button
                            className={`stats-sort-option ${huntSortType === "time-asc" ? "active" : ""}`}
                            onClick={() => {
                              setHuntSortType("time-asc");
                              setShowHuntSortDropdown(false);
                            }}
                          >
                            Shortest Time
                          </button>
                        </div>

                        {showcaseTab === "completed" && (
                          <div className="stats-sort-section">
                            <div className="stats-sort-section-title">
                              <Layers size={12} />
                              <span>Phases</span>
                            </div>
                            <button
                              className={`stats-sort-option ${huntSortType === "phases-desc" ? "active" : ""}`}
                              onClick={() => {
                                setHuntSortType("phases-desc");
                                setShowHuntSortDropdown(false);
                              }}
                            >
                              Most Phases
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hunts / Fails Grid */}
              {paginatedHunts.length === 0 ? (
                <div className="hunt-empty-state">
                  <p>{showcaseTab === "fails" ? "No logged fails match your search." : "No completed hunts match your search."}</p>
                </div>
              ) : (
                <>
                  <div className="hunt-showcase-grid">
                    {paginatedHunts.map((hunt, idx) => {
                      const isFail = hunt.isFail || showcaseTab === "fails";
                      const monObj = resolveHuntPokemon(hunt);
                      const sprite = getHuntSprite(hunt, useHomeSprites);
                      const displayName = formatPokemonName(hunt.pokemonName || hunt.pokemon?.name || monObj?.name || "Unknown");
                      const checks = Number(hunt.totalChecks || hunt.checks) || 0;
                      const timeMs = Number(hunt.elapsedMs || hunt.time) || 0;
                      const phaseCount = Number(hunt.phaseCount) || (hunt.phases?.length ? hunt.phases.length + 1 : 1);
                      const effectiveOdds = Number(hunt.odds) || calculateOdds(hunt.game, hunt.method, hunt.modifiers || {}) || 4096;
                      const dateStr = (hunt.date || hunt.timestamp)
                        ? new Date(hunt.date || hunt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                        : null;
                      const oddsEval = getOddsEvaluation(checks, effectiveOdds);

                      return (
                        <div key={hunt.entryId || hunt.id || idx} className={`hunt-showcase-card ${isFail ? "fail-card" : ""}`}>
                          {/* 1. Header: Sprite + Mon Info + Phase/Fail Tag */}
                          <div className="hunt-showcase-card-top">
                            <div className={`hunt-showcase-sprite-wrap ${isFail ? "fail-sprite-wrap" : ""}`}>
                              {sprite ? (
                                <img
                                  src={sprite}
                                  alt={displayName}
                                  className={`hunt-showcase-sprite ${!useHomeSprites ? "pixelated" : ""}`}
                                  style={!useHomeSprites ? { imageRendering: "pixelated" } : undefined}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <Sparkles size={28} className="text-yellow-400 opacity-60" />
                              )}
                            </div>
                            <div className="hunt-showcase-info">
                              <div className="hunt-showcase-name-row">
                                <span className="hunt-showcase-mon-name">{displayName}</span>
                                {hunt.nickname && <span className="hunt-showcase-nickname">"{hunt.nickname}"</span>}
                              </div>
                              <div className="hunt-showcase-meta-pills">
                                {hunt.game && <span className="hunt-showcase-pill pill-game">{hunt.game}</span>}
                                {hunt.method && <span className="hunt-showcase-pill pill-method">{hunt.method}</span>}
                                {isFail && hunt.reason && <span className="hunt-showcase-pill pill-reason">{hunt.reason}</span>}
                              </div>
                            </div>
                            <div className="hunt-showcase-top-right">
                              {isFail ? (
                                <span className="hunt-fail-tag">FAIL</span>
                              ) : phaseCount > 1 ? (
                                <span className="hunt-phase-badge">{phaseCount} Phases</span>
                              ) : null}
                            </div>
                          </div>

                          {/* 2. Key Metrics Row (Checks, Time, Odds) */}
                          <div className="hunt-showcase-stats-row">
                            <div className="hunt-stat-box">
                              <Crosshair size={13} className="hunt-stat-icon text-rose-400" />
                              <span className="hunt-stat-val text-rose-400">{checks.toLocaleString()}</span>
                              <span className="hunt-stat-lbl">CHECKS</span>
                            </div>
                            <div className="hunt-stat-box">
                              <Clock size={13} className="hunt-stat-icon text-blue-400" />
                              <span className="hunt-stat-val font-mono">{timeMs > 0 ? formatElapsed(timeMs) : "—"}</span>
                              <span className="hunt-stat-lbl">TIME</span>
                            </div>
                            <div className="hunt-stat-box">
                              <Sparkles size={13} className="hunt-stat-icon text-cyan-400" />
                              <span className="hunt-stat-val text-cyan-300">{effectiveOdds > 0 ? `1/${effectiveOdds.toLocaleString()}` : "—"}</span>
                              <span className="hunt-stat-lbl">ODDS</span>
                            </div>
                          </div>

                          {/* 3. Odds Evaluation Banner & Date */}
                          <div className={`hunt-showcase-odds-banner ${oddsEval?.type || "good"}`}>
                            {oddsEval ? (
                              <>
                                <span className="hunt-odds-pct-pill">{oddsEval.pctText}</span>
                                <span className="hunt-odds-comment">{oddsEval.comment}</span>
                              </>
                            ) : (
                              <span className="hunt-odds-comment">{isFail ? "Phase Encounter" : "Hunt Completed"}</span>
                            )}
                            {dateStr && (
                              <div className="hunt-odds-banner-date">
                                <Calendar size={12} className="text-gray-400 shrink-0" />
                                <span>{dateStr}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Pagination Controls */}
              {totalHuntPages > 1 && (
                <div className="hunt-breakdown-pagination mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn"
                    disabled={huntPage === 1}
                    onClick={() => setHuntPage(p => Math.max(1, p - 1))}
                    aria-label="Previous Page"
                    icon={<ChevronLeft size={16} />}
                  />
                  <span className="hunt-breakdown-page-text">
                    Page {huntPage} of {totalHuntPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn"
                    disabled={huntPage === totalHuntPages}
                    onClick={() => setHuntPage(p => Math.min(totalHuntPages, p + 1))}
                    aria-label="Next Page"
                    icon={<ChevronRight size={16} />}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: Generations Breakdown (Gen 1 - 9) */}
      <div className="stats-section-block">
        <div className="stats-section-title">
          <div className="stats-section-title-left">
            <span>Generation Progress</span>
          </div>
          <div className="stats-section-title-right">
            <SortPillToggle value={genSort} onChange={setGenSort} />
          </div>
        </div>

        <div className="generations-grid">
          {sortedGenerations.map(g => (
            <div key={g.gen} className="gen-card">
              <div className="gen-card-header">
                <div className="gen-card-header-left">
                  <span className="gen-roman">{g.roman}</span>
                  <div>
                    <h3 className="gen-name">{g.region}</h3>
                    <p className="gen-region">#{String(g.startId).padStart(4, '0')} - #{String(g.endId).padStart(4, '0')}</p>
                  </div>
                </div>
                <div className="gen-card-header-right">
                  {g.isCompleteMaster ? (
                    <span className="gen-master-badge">
                      <Mastery100Icon size={14} color="var(--accent)" /> Master
                    </span>
                  ) : (
                    <ProgressRing percentage={g.combinedPct} size={44} strokeWidth={4} color="var(--accent)" />
                  )}
                </div>
              </div>

              {/* Starter Sprites Row */}
              <div className="gen-starters-row">
                {g.starters?.map(s => (
                  <img 
                    key={s.id} 
                    src={s.sprite} 
                    alt={s.name} 
                    title={s.name} 
                    className={`gen-starter-img ${useHomeSprites ? "home-sprite" : "pixel-sprite"}`} 
                    draggable={false} 
                  />
                ))}
              </div>

              {/* Regular Progress */}
              <div className="gen-progress-row">
                <div className="gen-progress-label-wrap">
                  <span className="gen-progress-label">Regular</span>
                  <span className="gen-progress-val">{g.regularCaught} / {g.total} ({g.regularPct}%)</span>
                </div>
                <div className="gen-progress-bar">
                  <div 
                    className="gen-progress-fill" 
                    style={{ width: `${g.regularPct}%`, background: "var(--accent)" }} 
                  />
                </div>
              </div>

              {/* Shiny Progress */}
              <div className="gen-progress-row">
                <div className="gen-progress-label-wrap">
                  <span className="gen-progress-label">Shiny</span>
                  <span className="gen-progress-val">{g.shinyCaught} / {g.total} ({g.shinyPct}%)</span>
                </div>
                <div className="gen-progress-bar">
                  <div 
                    className="gen-progress-fill" 
                    style={{ width: `${g.shinyPct}%`, background: "var(--accent)" }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Special Classifications Breakdown */}
      {specialCategories && specialCategories.length > 0 && (
        <div className="stats-section-block">
          <div className="stats-section-title">
            <div className="stats-section-title-left">
              <span>Special Categories</span>
            </div>
            <div className="stats-section-title-right">
              <SortPillToggle value={specialSort} onChange={setSpecialSort} />
            </div>
          </div>

          <div className="categories-grid">
            {sortedSpecialCategories.map(cat => (
              <div key={cat.key} className="category-stat-card special-cat-card">
                <div className="category-stat-card-header">
                  <div className="special-cat-header-left">
                    {cat.sprite && (
                      <img 
                        src={cat.sprite} 
                        alt={cat.title} 
                        className={`special-cat-sprite ${useHomeSprites ? "home-sprite" : "pixel-sprite"}`} 
                        draggable={false} 
                      />
                    )}
                    <div>
                      <h4 className="category-stat-title">{cat.title}</h4>
                    </div>
                  </div>
                  <div className="category-stat-header-right">
                    {cat.isCompleteMaster ? (
                      <span className="gen-master-badge">
                        <Mastery100Icon size={14} color="var(--accent)" /> Master
                      </span>
                    ) : (
                      <ProgressRing percentage={cat.combinedPct} size={44} strokeWidth={4} color="var(--accent)" />
                    )}
                  </div>
                </div>

                {/* Regular Progress */}
                <div className="gen-progress-row">
                  <div className="gen-progress-label-wrap">
                    <span className="gen-progress-label">Regular</span>
                    <span className="gen-progress-val">{cat.regularCaught} / {cat.total} ({cat.regularPct}%)</span>
                  </div>
                  <div className="gen-progress-bar">
                    <div 
                      className="gen-progress-fill" 
                      style={{ width: `${cat.regularPct}%`, background: "var(--accent)" }} 
                    />
                  </div>
                </div>

                {/* Shiny Progress */}
                <div className="gen-progress-row">
                  <div className="gen-progress-label-wrap">
                    <span className="gen-progress-label">Shiny</span>
                    <span className="gen-progress-val">{cat.shinyCaught} / {cat.total} ({cat.shinyPct}%)</span>
                  </div>
                  <div className="gen-progress-bar">
                    <div 
                      className="gen-progress-fill" 
                      style={{ width: `${cat.shinyPct}%`, background: "var(--accent)" }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Forms & Variants Breakdown */}
      {categories && categories.length > 0 && (
        <div className="stats-section-block">
          <div className="stats-section-title">
            <div className="stats-section-title-left">
              <span>Form Progress</span>
            </div>
            <div className="stats-section-title-right">
              <SortPillToggle value={formSort} onChange={setFormSort} />
            </div>
          </div>

          <div className="categories-grid">
            {sortedCategories.map(cat => (
              <div key={cat.key} className="category-stat-card form-stat-card">
                <div className="category-stat-card-header">
                  <div className="special-cat-header-left">
                    {cat.badge && (
                      <img 
                        src={cat.badge} 
                        alt={cat.title} 
                        className="form-cat-badge" 
                        draggable={false} 
                      />
                    )}
                    <div>
                      <h4 className="category-stat-title">{cat.title}</h4>
                    </div>
                  </div>
                  <div className="category-stat-header-right">
                    {cat.isCompleteMaster ? (
                      <span className="gen-master-badge">
                        <Mastery100Icon size={14} color="var(--accent)" /> Master
                      </span>
                    ) : (
                      <ProgressRing percentage={cat.combinedPct} size={44} strokeWidth={4} color="var(--accent)" />
                    )}
                  </div>
                </div>

                {/* Regular Progress */}
                <div className="gen-progress-row">
                  <div className="gen-progress-label-wrap">
                    <span className="gen-progress-label">Regular</span>
                    <span className="gen-progress-val">{cat.regularCaught} / {cat.total} ({cat.regularPct}%)</span>
                  </div>
                  <div className="gen-progress-bar">
                    <div 
                      className="gen-progress-fill" 
                      style={{ width: `${cat.regularPct}%`, background: "var(--accent)" }} 
                    />
                  </div>
                </div>

                {/* Shiny Progress */}
                {!cat.noShiny && (
                  <div className="gen-progress-row">
                    <div className="gen-progress-label-wrap">
                      <span className="gen-progress-label">Shiny</span>
                      <span className="gen-progress-val">{cat.shinyCaught} / {cat.total} ({cat.shinyPct}%)</span>
                    </div>
                    <div className="gen-progress-bar">
                      <div 
                        className="gen-progress-fill" 
                        style={{ width: `${cat.shinyPct}%`, background: "var(--accent)" }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: Type Breakdown */}
      {types && types.length > 0 && (
        <div className="stats-section-block">
          <div className="stats-section-title">
            <div className="stats-section-title-left">
              <span>Type Progress</span>
            </div>
            <div className="stats-section-title-right">
              <SortPillToggle value={typeSort} onChange={setTypeSort} />
            </div>
          </div>

          <div className="categories-grid">
            {sortedTypes.map(t => (
              <div 
                key={t.key} 
                className="category-stat-card type-stat-card"
                style={{ 
                  borderColor: `color-mix(in srgb, ${t.color || "var(--accent)"} 30%, var(--border-color))` 
                }}
              >
                <div className="category-stat-card-header">
                  <div className="special-cat-header-left type-header-left">
                    <div className="type-icon-circle-wrap">
                      <img 
                        src={`/type-icons/${t.key.toLowerCase()}.png`} 
                        alt={t.name} 
                        className="type-cat-icon" 
                        draggable={false} 
                      />
                    </div>
                    <div>
                      <h4 className="category-stat-title">{t.name}</h4>
                    </div>
                  </div>
                  <div className="category-stat-header-right">
                    {t.isCompleteMaster ? (
                      <span 
                        className="gen-master-badge"
                        style={{ 
                          borderColor: `color-mix(in srgb, ${t.color || "var(--accent)"} 40%, var(--border-color))`,
                          color: t.color || "var(--accent)" 
                        }}
                      >
                        <Mastery100Icon size={14} color={t.color || "var(--accent)"} /> Master
                      </span>
                    ) : (
                      <ProgressRing percentage={t.combinedPct} size={44} strokeWidth={4} color={t.color || "var(--accent)"} />
                    )}
                  </div>
                </div>

                {/* Regular Progress */}
                <div className="gen-progress-row">
                  <div className="gen-progress-label-wrap">
                    <span className="gen-progress-label">Regular</span>
                    <span className="gen-progress-val">{t.regularCaught} / {t.total} ({t.regularPct}%)</span>
                  </div>
                  <div className="gen-progress-bar">
                    <div 
                      className="gen-progress-fill" 
                      style={{ width: `${t.regularPct}%`, background: t.color || "var(--accent)" }} 
                    />
                  </div>
                </div>

                {/* Shiny Progress */}
                <div className="gen-progress-row">
                  <div className="gen-progress-label-wrap">
                    <span className="gen-progress-label">Shiny</span>
                    <span className="gen-progress-val">{t.shinyCaught} / {t.total} ({t.shinyPct}%)</span>
                  </div>
                  <div className="gen-progress-bar">
                    <div 
                      className="gen-progress-fill" 
                      style={{ width: `${t.shinyPct}%`, background: t.color || "var(--accent)" }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Games Distribution & Hunting Methods (Split Row) */}
      <div className="stats-split-row">
        {/* Games Hunted In */}
        <div className="stats-section-block" style={{ marginBottom: 0 }}>
          <div className="stats-section-title stats-section-title-clean">
            <div className="stats-header-with-badge">
              <div className="stats-header-badge">
                <Gamepad2 size={24} className="stats-header-badge-icon" />
              </div>
              <div className="stats-header-text">
                <h3 className="stats-header-main-title">Games Hunted In</h3>
                <p className="stats-header-sub-info">
                  {allGames.length} games &bull; {totalGameHunts.toLocaleString()} recorded hunts
                </p>
              </div>
            </div>
          </div>

          {allGames.length === 0 ? (
            <div className="stats-empty-box">No game history recorded yet.</div>
          ) : (
            <>
              <div className="ranked-list">
                {paginatedGames.map((g, i) => (
                  <div key={i} className="ranked-item">
                    <div className="ranked-item-left">
                      {g.image && <img src={g.image} alt={g.name} className="ranked-item-img" />}
                      <span className="ranked-item-name">{g.name}</span>
                    </div>
                    <div className="ranked-item-right">
                      <span className="ranked-item-count">{g.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalGamesPages > 1 ? (
                <div className="stats-pagination">
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn" 
                    disabled={gamesPage === 1}
                    onClick={() => setGamesPage(p => Math.max(1, p - 1))}
                    aria-label="Previous Page"
                    icon={<ChevronLeft size={16} />}
                  />
                  <span className="stats-page-indicator">
                    {gamesPage} / {totalGamesPages}
                  </span>
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn" 
                    disabled={gamesPage === totalGamesPages}
                    onClick={() => setGamesPage(p => Math.min(totalGamesPages, p + 1))}
                    aria-label="Next Page"
                    icon={<ChevronRight size={16} />}
                  />
                </div>
              ) : (
                <div className="stats-pagination-spacer" />
              )}
            </>
          )}
        </div>

        {/* Hunting Methods */}
        <div className="stats-section-block" style={{ marginBottom: 0 }}>
          <div className="stats-section-title stats-section-title-clean">
            <div className="stats-header-with-badge">
              <div className="stats-header-badge">
                <Crosshair size={24} className="stats-header-badge-icon" />
              </div>
              <div className="stats-header-text">
                <h3 className="stats-header-main-title">Hunting Methods</h3>
                <p className="stats-header-sub-info">
                  {allMethods.length} methods &bull; {totalMethodHunts.toLocaleString()} recorded hunts
                </p>
              </div>
            </div>
          </div>

          {allMethods.length === 0 ? (
            <div className="stats-empty-box">No hunt method data logged yet.</div>
          ) : (
            <>
              <div className="ranked-list">
                {paginatedMethods.map((m, i) => (
                  <div key={i} className="ranked-item">
                    <div className="ranked-item-left">
                      <span className="ranked-item-name">{m.name}</span>
                    </div>
                    <div className="ranked-item-right">
                      <span className="ranked-item-count">{m.count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalMethodsPages > 1 ? (
                <div className="stats-pagination">
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn" 
                    disabled={methodsPage === 1}
                    onClick={() => setMethodsPage(p => Math.max(1, p - 1))}
                    aria-label="Previous Page"
                    icon={<ChevronLeft size={16} />}
                  />
                  <span className="stats-page-indicator">
                    {methodsPage} / {totalMethodsPages}
                  </span>
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="stats-page-btn" 
                    disabled={methodsPage === totalMethodsPages}
                    onClick={() => setMethodsPage(p => Math.min(totalMethodsPages, p + 1))}
                    aria-label="Next Page"
                    icon={<ChevronRight size={16} />}
                  />
                </div>
              ) : (
                <div className="stats-pagination-spacer" />
              )}
            </>
          )}
        </div>
      </div>

      {/* SECTION 4: Poké Balls Vault */}
      <div className="stats-section-block">
        <div className="stats-section-title stats-section-title-clean">
          <div className="stats-header-text">
            <div className="stats-vault-header-row">
              <h3 className="stats-header-main-title">Poké Ball Vault</h3>
              <span className="stats-vault-badge">{allBalls.length} Unique Balls Used</span>
            </div>
            <p className="stats-header-sub-info">
              {totalBallsCaught.toLocaleString()} total caught &bull; {totalBallsRegular.toLocaleString()} regular &bull; {totalBallsShiny.toLocaleString()} shiny
            </p>
          </div>

          <div className="stats-section-title-right">
            <div className={`stats-sort-button-wrap ${showBallSortDropdown ? 'open' : ''}`} ref={ballSortRef}>
              <Button
                variant="secondary"
                size="sm"
                className="stats-sort-button"
                onClick={() => setShowBallSortDropdown(!showBallSortDropdown)}
                aria-label="Sort Poké Balls"
                icon={<ArrowUpDown size={15} />}
              >
                <span>{getBallSortLabel()}</span>
              </Button>

              {showBallSortDropdown && (
                <div className="stats-sort-dropdown">
                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <PokeballIcon size={12} />
                      <span>Catches</span>
                    </div>
                    <button
                      className={`stats-sort-option ${ballSortType === "most-caught" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("most-caught");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Most Caught
                    </button>
                    <button
                      className={`stats-sort-option ${ballSortType === "least-caught" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("least-caught");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Least Caught
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Sparkles size={12} />
                      <span>Form Catches</span>
                    </div>
                    <button
                      className={`stats-sort-option ${ballSortType === "most-shiny" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("most-shiny");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Most Shiny
                    </button>
                    <button
                      className={`stats-sort-option ${ballSortType === "most-regular" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("most-regular");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Most Regular
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Search size={12} />
                      <span>Name</span>
                    </div>
                    <button
                      className={`stats-sort-option ${ballSortType === "alpha-asc" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("alpha-asc");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Name (A → Z)
                    </button>
                    <button
                      className={`stats-sort-option ${ballSortType === "alpha-desc" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("alpha-desc");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Name (Z → A)
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Calendar size={12} />
                      <span>Release</span>
                    </div>
                    <button
                      className={`stats-sort-option ${ballSortType === "release-date" ? "active" : ""}`}
                      onClick={() => {
                        setBallSortType("release-date");
                        setShowBallSortDropdown(false);
                      }}
                    >
                      Release Date
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {allBalls.length === 0 ? (
          <div className="stats-empty-box">No Poké Ball catches recorded yet.</div>
        ) : (
          <div className="item-vault-grid">
            {sortedBalls.map((b, i) => (
              <div key={i} className="item-vault-card">
                {b.image && <img src={b.image} alt={b.name} className="item-vault-img" />}
                <div className="item-vault-info">
                  <span className="item-vault-name" title={b.name}>{b.name}</span>
                  <span className="item-vault-count">{b.count} Caught</span>
                  <span className="item-vault-split">{b.regular} reg • {b.shiny} shiny</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Marks & Ribbons Showcase */}
      <div className="stats-section-block">
        <div className="stats-section-title stats-section-title-clean">
          <div className="stats-header-text">
            <div className="stats-vault-header-row">
              <h3 className="stats-header-main-title">Marks & Ribbons Showcase</h3>
              <span className="stats-vault-badge">{allMarks.length} Unique Marks Used</span>
            </div>
            <p className="stats-header-sub-info">
              {totalMarksCaught.toLocaleString()} total marked &bull; {totalMarksRegular.toLocaleString()} regular &bull; {totalMarksShiny.toLocaleString()} shiny
            </p>
          </div>

          <div className="stats-section-title-right">
            <div className={`stats-sort-button-wrap ${showMarkSortDropdown ? 'open' : ''}`} ref={markSortRef}>
              <Button
                variant="secondary"
                size="sm"
                className="stats-sort-button"
                onClick={() => setShowMarkSortDropdown(!showMarkSortDropdown)}
                aria-label="Sort Marks and Ribbons"
                icon={<ArrowUpDown size={15} />}
              >
                <span>{getMarkSortLabel()}</span>
              </Button>

              {showMarkSortDropdown && (
                <div className="stats-sort-dropdown">
                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Award size={12} />
                      <span>Marks</span>
                    </div>
                    <button
                      className={`stats-sort-option ${markSortType === "most-marked" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("most-marked");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Most Marked
                    </button>
                    <button
                      className={`stats-sort-option ${markSortType === "least-marked" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("least-marked");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Least Marked
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Sparkles size={12} />
                      <span>Form Catches</span>
                    </div>
                    <button
                      className={`stats-sort-option ${markSortType === "most-shiny" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("most-shiny");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Most Shiny
                    </button>
                    <button
                      className={`stats-sort-option ${markSortType === "most-regular" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("most-regular");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Most Regular
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Search size={12} />
                      <span>Name</span>
                    </div>
                    <button
                      className={`stats-sort-option ${markSortType === "alpha-asc" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("alpha-asc");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Name (A → Z)
                    </button>
                    <button
                      className={`stats-sort-option ${markSortType === "alpha-desc" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("alpha-desc");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Name (Z → A)
                    </button>
                  </div>

                  <div className="stats-sort-section">
                    <div className="stats-sort-section-title">
                      <Calendar size={12} />
                      <span>Release</span>
                    </div>
                    <button
                      className={`stats-sort-option ${markSortType === "release-date" ? "active" : ""}`}
                      onClick={() => {
                        setMarkSortType("release-date");
                        setShowMarkSortDropdown(false);
                      }}
                    >
                      Release Date
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {allMarks.length === 0 ? (
          <div className="stats-empty-box">No marks or ribbons logged on Pokémon yet.</div>
        ) : (
          <div className="item-vault-grid">
            {sortedMarks.map((m, i) => (
              <div key={i} className="item-vault-card">
                {m.image && <img src={m.image} alt={m.name} className="item-vault-img" />}
                <div className="item-vault-info">
                  <span className="item-vault-name" title={m.name}>{m.name}</span>
                  <span className="item-vault-count">{m.count} Marked</span>
                  <span className="item-vault-split">{m.regular} reg &bull; {m.shiny} shiny</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 6: Gender Distribution */}
      {genderStats.total > 0 && (
        <div className="stats-section-block">
          <div className="stats-section-title">
            <div className="stats-section-title-left">
              <span>Gender Distribution ({genderStats.total} Logged)</span>
            </div>
          </div>

          <div className="gender-meter-wrap">
            <div className="gender-meter-bar">
              <div 
                className="gender-bar-male" 
                style={{ width: `${(genderStats.male / genderStats.total) * 100}%` }} 
                title={`Male: ${genderStats.male}`} 
              />
              <div 
                className="gender-bar-female" 
                style={{ width: `${(genderStats.female / genderStats.total) * 100}%` }} 
                title={`Female: ${genderStats.female}`} 
              />
              <div 
                className="gender-bar-genderless" 
                style={{ width: `${(genderStats.genderless / genderStats.total) * 100}%` }} 
                title={`Genderless: ${genderStats.genderless}`} 
              />
            </div>

            <div className="gender-legend">
              <div className="gender-legend-item">
                <span className="gender-dot male" />
                <span>Male: <strong>{genderStats.male}</strong> ({Math.round((genderStats.male / genderStats.total) * 100)}%)</span>
              </div>
              <div className="gender-legend-item">
                <span className="gender-dot female" />
                <span>Female: <strong>{genderStats.female}</strong> ({Math.round((genderStats.female / genderStats.total) * 100)}%)</span>
              </div>
              <div className="gender-legend-item">
                <span className="gender-dot genderless" />
                <span>Genderless: <strong>{genderStats.genderless}</strong> ({Math.round((genderStats.genderless / genderStats.total) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
